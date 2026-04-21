import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getDeviceMetadata } from "../lib/deviceInfo";

const AuthContext = createContext();
const LAST_AUTH_USER_KEY = "lastAuthenticatedUserId";
const SECURITY_VERIFIED_KEY = "isSecurityVerified";
const SECURITY_VERIFIED_USER_KEY = "securityVerifiedUserId";
const ACTIVE_SESSION_ID_KEY = "activeSessionId";
const ACTIVE_SESSION_USER_KEY = "activeSessionUserId";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const CLIENT_SESSION_ID_KEY = "clientSessionId";

export function useAuth() {
  return useContext(AuthContext);
}

// ---------------------------------------------------------------------------
// Module-level singleton map for session-creation promises.
// Lives OUTSIDE the component so it survives React StrictMode's double-mount.
// Key: clientSessionId  →  Value: Promise<firestoreDocId | null>
// Both racing invocations (StrictMode remount / fast re-render) share the same
// Promise, so exactly one Firestore addDoc is ever executed per tab session.
// ---------------------------------------------------------------------------
const sessionCreationPromises = new Map();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => auth?.currentUser || null);
  const [loading, setLoading] = useState(() => !!auth);
  const [isSecurityVerified, setIsSecurityVerified] = useState(() => {
    // Eagerly restore local session auth to prevent redirect flashes on fast reloads
    const savedUser = localStorage.getItem(LAST_AUTH_USER_KEY);
    if (!savedUser) return false;
    return (
      localStorage.getItem(SECURITY_VERIFIED_KEY) === "true" &&
      localStorage.getItem(SECURITY_VERIFIED_USER_KEY) === savedUser
    );
  });
  const [deviceSessions, setDeviceSessions] = useState([]);
  const [deviceSessionsLoading, setDeviceSessionsLoading] = useState(true);
  const [deduplicatedSessionsCount, setDeduplicatedSessionsCount] = useState(0);
  const [lastKnownUserId, setLastKnownUserId] = useState(
    () => auth?.currentUser?.uid || localStorage.getItem(LAST_AUTH_USER_KEY) || null
  );
  const [activeSessionId, setActiveSessionId] = useState(
    localStorage.getItem(ACTIVE_SESSION_ID_KEY) || null
  );
  const activeSessionIdRef = useRef(activeSessionId);
  const duplicateCleanupInFlightRef = useRef(false);

  function getStoredActiveSessionId(userId) {
    const sessionId = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
    const sessionUserId = localStorage.getItem(ACTIVE_SESSION_USER_KEY);
    if (!sessionId || (sessionUserId && sessionUserId !== userId)) return null;
    return sessionId;
  }

  function hasStoredFullAuthMarker(userId) {
    return (
      !!userId &&
      localStorage.getItem(SECURITY_VERIFIED_KEY) === "true" &&
      localStorage.getItem(SECURITY_VERIFIED_USER_KEY) === userId
    );
  }

  function storeSecurityVerification(userId) {
    localStorage.setItem(SECURITY_VERIFIED_KEY, "true");
    localStorage.setItem(SECURITY_VERIFIED_USER_KEY, userId);
  }

  function clearSecurityVerification() {
    sessionStorage.removeItem(SECURITY_VERIFIED_KEY);
    sessionStorage.removeItem(SECURITY_VERIFIED_USER_KEY);
    localStorage.removeItem(SECURITY_VERIFIED_KEY);
    localStorage.removeItem(SECURITY_VERIFIED_USER_KEY);
  }

  function storeActiveSession(userId, sessionId) {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, sessionId);
    localStorage.setItem(ACTIVE_SESSION_USER_KEY, userId);
    setActiveSessionId(sessionId);
  }

  function clearActiveSession() {
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    localStorage.removeItem(ACTIVE_SESSION_USER_KEY);
    setActiveSessionId(null);
  }

  function timestampToMillis(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate().getTime();
    if (typeof value.seconds === "number") return value.seconds * 1000;

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  function isSessionExpired(session) {
    const expiresAt = timestampToMillis(session.expiresAt);
    return !!expiresAt && expiresAt <= Date.now();
  }

  async function restoreVerifiedSession(userId) {
    if (!hasStoredFullAuthMarker(userId)) {
      clearSecurityVerification();
      clearActiveSession();
      return false;
    }

    const storedSessionId = getStoredActiveSessionId(userId);
    if (!db || !storedSessionId) {
      // We are verified locally, but cannot reach DB or lack a session ID. Trust local marker.
      return true;
    }

    try {
      // Check the remote session status securely to see if they were logged out remotely
      const sessionSnap = await getDoc(doc(db, "deviceSessions", storedSessionId));
      if (sessionSnap.exists()) {
        const session = sessionSnap.data();
        const remotelyLoggedOut = session.status !== "active";
        
        if (remotelyLoggedOut || isSessionExpired(session)) {
          clearSecurityVerification();
          clearActiveSession();
          return false;
        }

        // If it's valid, update the keepalive markers invisibly
        await updateDoc(sessionSnap.ref, {
          authenticationState: "fully_authenticated",
          passwordVerified: true,
          securityKeyVerified: true,
          lastSeenAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });
      }

      storeActiveSession(userId, storedSessionId);
      return true;
    } catch (error) {
      // CRITICAL FIX: If the DB fetch fails due to network, permissions, cache, etc.,
      // DO NOT force logout. Trust the persistent local storage session markers to allow a seamless refresh!
      console.warn("Non-fatal: Could not verify session against DB. Trusting persistent local session.", error);
      return true;
    }
  }

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  function getOrCreateClientSessionId(userId) {
    let existing = sessionStorage.getItem(CLIENT_SESSION_ID_KEY);
    if (existing) return existing;

    const generated = `${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    sessionStorage.setItem(CLIENT_SESSION_ID_KEY, generated);
    return generated;
  }

  async function createDeviceSession(
    user,
    { secondFactorVerified = false } = {}
  ) {
    if (!db || !user) return null;
    if (!secondFactorVerified) return null;

    // Derive the idempotency key for this browser tab session.
    // getOrCreateClientSessionId writes to sessionStorage on first call, so any
    // concurrent caller (e.g. StrictMode's second mount) will read the same key.
    const clientSessionId = getOrCreateClientSessionId(user.uid);

    // If a creation is already in-flight for this clientSessionId (same Promise),
    // piggyback on it instead of launching a second Firestore addDoc.
    if (sessionCreationPromises.has(clientSessionId)) {
      return sessionCreationPromises.get(clientSessionId);
    }

    const promise = (async () => {
      try {
        // Check Firestore: has this tab already created an active session?
        const existingQuery = query(
          collection(db, "deviceSessions"),
          where("clientSessionId", "==", clientSessionId),
          limit(1)
        );
        const existingSnap = await getDocs(existingQuery);

        if (!existingSnap.empty) {
          const existing = existingSnap.docs[0];
          const existingData = existing.data();

          if (existingData.status !== "logged_out") {
            await updateDoc(existing.ref, {
              authenticationState: "fully_authenticated",
              passwordVerified: true,
              securityKeyVerified: true,
              lastSeenAt: serverTimestamp(),
              expiresAt: new Date(Date.now() + SESSION_TTL_MS),
            });
            storeActiveSession(user.uid, existing.id);
            return existing.id;
          }
        }

        // No existing active session — create one
        const metadata = getDeviceMetadata();
        const now = Date.now();
        const expiresAt = new Date(now + SESSION_TTL_MS);
        const sessionKey = `${metadata.deviceType}-${metadata.browser}-${metadata.os}-${now}`;

        const docRef = await addDoc(collection(db, "deviceSessions"), {
          userId: user.uid,
          clientSessionId,
          status: "active",
          authenticationState: "fully_authenticated",
          passwordVerified: true,
          securityKeyVerified: true,
          loginAt: serverTimestamp(),
          clientLoginAt: new Date(),
          lastSeenAt: serverTimestamp(),
          expiresAt,
          logoutAt: null,
          logoutReason: null,
          sessionKey,
          ...metadata,
        });

        storeActiveSession(user.uid, docRef.id);
        return docRef.id;
      } finally {
        // Release the lock so fresh logins after logout start a new promise
        sessionCreationPromises.delete(clientSessionId);
      }
    })();

    sessionCreationPromises.set(clientSessionId, promise);
    return promise;
  }

  async function markSessionLoggedOut(sessionId, reason = "logged_out") {
    if (!db || !sessionId) return;
    try {
      await updateDoc(doc(db, "deviceSessions", sessionId), {
        status: "logged_out",
        logoutAt: serverTimestamp(),
        logoutReason: reason,
        expiresAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to update session status:", error);
    }
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user?.uid) {
        setLastKnownUserId(user.uid);
        localStorage.setItem(LAST_AUTH_USER_KEY, user.uid);
        setIsSecurityVerified(await restoreVerifiedSession(user.uid));
      }
      // If user logs out, clear verification
      if (!user) {
        if (activeSessionIdRef.current) {
          markSessionLoggedOut(activeSessionIdRef.current, "session_ended");
          clearActiveSession();
        }
        setLastKnownUserId(null);
        localStorage.removeItem(LAST_AUTH_USER_KEY);
        setIsSecurityVerified(false);
        clearSecurityVerification();
      }
      setLoading(false);
    });

    return unsubscribe;
    // Subscribe once; the callback restores auth state from storage/Firestore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!db || !currentUser || !isSecurityVerified) {
      setDeviceSessions([]);
      setDeviceSessionsLoading(false);
      return;
    }

    setDeviceSessionsLoading(true);
    const sessionsQuery = query(
      collection(db, "deviceSessions"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const sessions = snapshot.docs.map((sessionDoc) => ({
          id: sessionDoc.id,
          ...sessionDoc.data(),
        }));
        setDeviceSessions(sessions);
        setDeviceSessionsLoading(false);
      },
      (error) => {
        console.error("Error loading device sessions:", error);
        setDeviceSessionsLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, isSecurityVerified]);

  useEffect(() => {
    if (
      !db ||
      !currentUser ||
      !isSecurityVerified ||
      deviceSessions.length === 0
    ) {
      return;
    }
    if (duplicateCleanupInFlightRef.current) return;

    const activeWithClientId = deviceSessions.filter(
      (session) => session.status === "active" && session.clientSessionId
    );
    if (activeWithClientId.length < 2) return;

    const byClientSessionId = activeWithClientId.reduce((acc, session) => {
      const key = session.clientSessionId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    const sessionsToClose = [];

    Object.values(byClientSessionId).forEach((sessions) => {
      if (sessions.length <= 1) return;

      const sortedNewestFirst = [...sessions].sort((a, b) => {
        const aTime = a.lastSeenAt?.toDate
          ? a.lastSeenAt.toDate().getTime()
          : a.clientLoginAt
          ? new Date(a.clientLoginAt).getTime()
          : 0;
        const bTime = b.lastSeenAt?.toDate
          ? b.lastSeenAt.toDate().getTime()
          : b.clientLoginAt
          ? new Date(b.clientLoginAt).getTime()
          : 0;
        return bTime - aTime;
      });

      sessionsToClose.push(...sortedNewestFirst.slice(1));
    });

    if (sessionsToClose.length === 0) return;

    duplicateCleanupInFlightRef.current = true;
    Promise.all(
      sessionsToClose.map((session) =>
        updateDoc(doc(db, "deviceSessions", session.id), {
          status: "logged_out",
          logoutAt: serverTimestamp(),
          logoutReason: "deduplicated_session",
          expiresAt: new Date(),
        })
      )
    )
      .catch((error) => {
        console.error("Failed to cleanup duplicate sessions:", error);
      })
      .then(() => {
        setDeduplicatedSessionsCount((prev) => prev + sessionsToClose.length);
      })
      .finally(() => {
        duplicateCleanupInFlightRef.current = false;
      });
  }, [currentUser, deviceSessions, isSecurityVerified]);

  useEffect(() => {
    if (!db || !currentUser || !isSecurityVerified || !activeSessionId) return;

    const sendHeartbeat = async () => {
      try {
        await updateDoc(doc(db, "deviceSessions", activeSessionId), {
          status: "active",
          lastSeenAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });
      } catch (error) {
        console.error("Session heartbeat failed:", error);
      }
    };

    sendHeartbeat();

    const heartbeat = setInterval(async () => {
      await sendHeartbeat();
    }, 5 * 60 * 1000);

    const handleVisibility = async () => {
      if (document.visibilityState === "visible") {
        await sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeSessionId, currentUser, isSecurityVerified]);

  async function login(email, password) {
    if (!auth) {
      throw new Error("Firebase configuration is missing. Cannot log in.");
    }

    try {
      clearSecurityVerification();
      setIsSecurityVerified(false);
      clearActiveSession();
      sessionStorage.removeItem(CLIENT_SESSION_ID_KEY);

      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setCurrentUser(userCredential.user);
      return userCredential;
    } catch (error) {
      throw new Error("Invalid credentials.", { cause: error });
    }
  }

  async function verifySecurityKey(inputKey) {
    if (!db) throw new Error("Database unavailable.");

    try {
      const authenticatedUser = currentUser || auth?.currentUser;
      if (!authenticatedUser?.uid) {
        throw new Error("Authentication required.");
      }

      const securityRef = doc(db, "security", "key");
      const securitySnap = await getDoc(securityRef);

      if (securitySnap.exists()) {
        const validKey = securitySnap.data().securityKey;
        if (inputKey === validKey) {
          const sessionId = await createDeviceSession(authenticatedUser, {
            secondFactorVerified: true,
          });
          setIsSecurityVerified(true);
          storeSecurityVerification(authenticatedUser.uid);
          return !!sessionId;
        }
      }
      throw new Error("Invalid Security Key.");
    } catch (error) {
      if (error.message === "Invalid Security Key.") throw error;
      if (error.message === "Authentication required.") throw error;
      console.error("Security check failed:", error);
      throw new Error("Validation failed. Please try again.", {
        cause: error,
      });
    }
  }

  async function signup() {
    throw new Error("Sign up is disabled for this personal application.");
  }

  async function resetPassword(email) {
    if (!auth) {
      throw new Error(
        "Firebase configuration is missing. Cannot reset password."
      );
    }
    return sendPasswordResetEmail(auth, email);
  }

  async function logout() {
    if (!auth) return;
    if (activeSessionId) {
      await markSessionLoggedOut(activeSessionId, "manual_logout");
      clearActiveSession();
    }
    sessionStorage.removeItem(CLIENT_SESSION_ID_KEY);
    setIsSecurityVerified(false);
    clearSecurityVerification();
    return signOut(auth);
  }

  const sessionsWithCurrentFlag = deviceSessions.map((session) => ({
    ...session,
    isCurrentSession: session.id === activeSessionId,
  }));

  const uniqueActiveDeviceCount = new Set(
    sessionsWithCurrentFlag
      .filter((session) => session.status === "active")
      .map(
        (session) =>
          session.clientSessionId ||
          `${session.userAgent || ""}-${session.deviceType || ""}-${session.browser || ""}-${session.os || ""}`
      )
  ).size;

  const value = {
    currentUser,
    authLoading: loading,
    lastKnownUserId,
    isSecurityVerified,
    login,
    verifySecurityKey,
    signup,
    logout,
    resetPassword,
    deviceSessions: sessionsWithCurrentFlag,
    deviceSessionsLoading,
    activeSessionCount: uniqueActiveDeviceCount,
    activeSessionId,
    deduplicatedSessionsCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
