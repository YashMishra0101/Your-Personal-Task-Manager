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
  const [loading, setLoading] = useState(() => !!auth && !auth.currentUser);
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [deviceSessions, setDeviceSessions] = useState([]);
  const [deviceSessionsLoading, setDeviceSessionsLoading] = useState(true);
  const [deduplicatedSessionsCount, setDeduplicatedSessionsCount] = useState(0);
  const [lastKnownUserId, setLastKnownUserId] = useState(
    () => auth?.currentUser?.uid || localStorage.getItem(LAST_AUTH_USER_KEY) || null
  );
  const [activeSessionId, setActiveSessionId] = useState(
    localStorage.getItem("activeSessionId") || null
  );
  const activeSessionIdRef = useRef(activeSessionId);
  const duplicateCleanupInFlightRef = useRef(false);

  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
  const CLIENT_SESSION_ID_KEY = "clientSessionId";

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

  async function createDeviceSession(user) {
    if (!db || !user) return null;

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
            localStorage.setItem("activeSessionId", existing.id);
            setActiveSessionId(existing.id);
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
          loginAt: serverTimestamp(),
          clientLoginAt: new Date(),
          lastSeenAt: serverTimestamp(),
          expiresAt,
          logoutAt: null,
          logoutReason: null,
          sessionKey,
          ...metadata,
        });

        localStorage.setItem("activeSessionId", docRef.id);
        setActiveSessionId(docRef.id);
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
    // Check local storage for verification status on load
    const verified = localStorage.getItem("isSecurityVerified") === "true";
    setIsSecurityVerified(verified);

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user?.uid) {
        setLastKnownUserId(user.uid);
        localStorage.setItem(LAST_AUTH_USER_KEY, user.uid);
      }
      // If user logs out, clear verification
      if (!user) {
        if (activeSessionIdRef.current) {
          markSessionLoggedOut(activeSessionIdRef.current, "session_ended");
          localStorage.removeItem("activeSessionId");
          setActiveSessionId(null);
        }
        setLastKnownUserId(null);
        localStorage.removeItem(LAST_AUTH_USER_KEY);
        setIsSecurityVerified(false);
        localStorage.removeItem("isSecurityVerified");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!db || !currentUser || activeSessionId) return;

    let cancelled = false;
    const ensureSession = async () => {
      try {
        const newSessionId = await createDeviceSession(currentUser);
        if (cancelled || !newSessionId) return;
      } catch (error) {
        console.error("Failed to initialize device session:", error);
      }
    };

    ensureSession();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, currentUser]);

  useEffect(() => {
    if (!db || !currentUser) {
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
  }, [currentUser]);

  useEffect(() => {
    if (!db || !currentUser || deviceSessions.length === 0) return;
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
  }, [currentUser, deviceSessions]);

  useEffect(() => {
    if (!db || !currentUser || !activeSessionId) return;

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
  }, [activeSessionId, currentUser]);

  async function login(email, password) {
    if (!auth) {
      throw new Error("Firebase configuration is missing. Cannot log in.");
    }

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setCurrentUser(userCredential.user);
      return userCredential;
    } catch (error) {
      throw new Error("Invalid credentials.");
    }
  }

  async function verifySecurityKey(inputKey) {
    if (!db) throw new Error("Database unavailable.");

    try {
      const securityRef = doc(db, "security", "key");
      const securitySnap = await getDoc(securityRef);

      if (securitySnap.exists()) {
        const validKey = securitySnap.data().securityKey;
        if (inputKey === validKey) {
          setIsSecurityVerified(true);
          localStorage.setItem("isSecurityVerified", "true");
          return true;
        }
      }
      throw new Error("Invalid Security Key.");
    } catch (error) {
      if (error.message === "Invalid Security Key.") throw error;
      console.error("Security check failed:", error);
      throw new Error("Validation failed. Please try again.");
    }
  }

  async function signup(email, password) {
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
      localStorage.removeItem("activeSessionId");
      setActiveSessionId(null);
    }
    sessionStorage.removeItem(CLIENT_SESSION_ID_KEY);
    setIsSecurityVerified(false);
    localStorage.removeItem("isSecurityVerified");
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
