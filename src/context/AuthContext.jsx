import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);

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
        setIsSecurityVerified(false);
        localStorage.removeItem("isSecurityVerified");
      }
    });

    return unsubscribe;
  }, []);

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
    setIsSecurityVerified(false);
    localStorage.removeItem("isSecurityVerified");
    return signOut(auth);
  }

  const value = {
    currentUser,
    isSecurityVerified,
    login,
    verifySecurityKey,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
