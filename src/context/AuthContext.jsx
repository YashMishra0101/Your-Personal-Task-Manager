import React, { createContext, useContext, useState, useEffect } from "react";
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
  query,
  where,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getDeviceMetadata } from "../lib/deviceInfo";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [deviceSessions, setDeviceSessions] = useState([]);
  const [deviceSessionsLoading, setDeviceSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(
    localStorage.getItem("activeSessionId") || null
  );

  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

  async function createDeviceSession(user) {
    if (!db || !user) return null;

    const metadata = getDeviceMetadata();
    const now = Date.now();
    const expiresAt = new Date(now + SESSION_TTL_MS);
    const sessionKey = `${metadata.deviceType}-${metadata.browser}-${metadata.os}-${now}`;

    const docRef = await addDoc(collection(db, "deviceSessions"), {
      userId: user.uid,
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
      // If user logs out, clear verification
      if (!user) {
        if (activeSessionId) {
          markSessionLoggedOut(activeSessionId, "session_ended");
          localStorage.removeItem("activeSessionId");
          setActiveSessionId(null);
        }
        setIsSecurityVerified(false);
        localStorage.removeItem("isSecurityVerified");
      }
    });

    return unsubscribe;
  }, [activeSessionId]);

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
      await createDeviceSession(userCredential.user);
      return userCredential;
    } catch (error) {
      throw new Error("Invalid credentials.");
    }
  }

  async function verifySecurityKey(inputKey) {
    if (!db) throw new Error("Database unavailable.");

    try {
      const securityRef = doc(db, "security", "1");
      const securitySnap = await getDoc(securityRef);

      if (securitySnap.exists()) {
        const validKey = securitySnap.data().key;
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
    setIsSecurityVerified(false);
    localStorage.removeItem("isSecurityVerified");
    return signOut(auth);
  }

  const sessionsWithCurrentFlag = deviceSessions.map((session) => ({
    ...session,
    isCurrentSession: session.id === activeSessionId,
  }));

  const value = {
    currentUser,
    isSecurityVerified,
    login,
    verifySecurityKey,
    signup,
    logout,
    resetPassword,
    deviceSessions: sessionsWithCurrentFlag,
    deviceSessionsLoading,
    activeSessionCount: sessionsWithCurrentFlag.filter((session) => session.status === "active").length,
    activeSessionId,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
