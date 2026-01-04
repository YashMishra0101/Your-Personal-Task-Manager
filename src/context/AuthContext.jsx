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
import { getDeviceId } from "../lib/device";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate if current device is still registered
  async function validateDeviceSession(user) {
    if (!db || !user) return true;

    try {
      const deviceId = getDeviceId();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const devices = userSnap.data().devices || [];
        const isDeviceRegistered = devices.some((d) => d.deviceId === deviceId);

        if (!isDeviceRegistered) {
          // Device was removed, force logout
          await signOut(auth);
          return false;
        }
      }

      return true;
    } catch (error) {
      // If Firestore is blocked (ERR_BLOCKED_BY_CLIENT), we log and let user proceed
      console.warn(
        "Device validation skipped (Firestore likely blocked):",
        error
      );
      return true;
    }
  }

  useEffect(() => {
    // If auth is null (missing config), we just stop loading and don't attach listener.
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        // Run validation asynchronously to not block the main auth state
        validateDeviceSession(user);
      }
    });

    return unsubscribe;
  }, []);

  // Real-time device validation check
  useEffect(() => {
    if (!currentUser || !db) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const unsubscribe = onSnapshot(
        userRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const devices = snapshot.data().devices || [];
            const deviceId = getDeviceId();
            const isDeviceRegistered = devices.some(
              (d) => d.deviceId === deviceId
            );

            if (!isDeviceRegistered) {
              // Device was removed, force logout
              await signOut(auth);
            }
          }
        },
        (error) => {
          console.error(
            "Firestore onSnapshot error (likely blocked by client/ad-blocker):",
            error
          );
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up Firestore listener:", error);
    }
  }, [currentUser]);

  async function login(email, password) {
    if (!auth) {
      throw new Error("Firebase configuration is missing. Cannot log in.");
    }

    // 1. Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Check Device Restrictions
    if (db) {
      try {
        const deviceId = getDeviceId();
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        let devices = [];

        if (userSnap.exists()) {
          devices = userSnap.data().devices || [];
        }

        // Check if this device is already registered
        const isRegistered = devices.find((d) => d.deviceId === deviceId);

        if (!isRegistered) {
          if (devices.length >= 2) {
            // LIMIT REACHED: Sign out immediately
            await signOut(auth);
            throw new Error(
              "Security Alert: Device limit reached. You can only access this account from 2 devices."
            );
          }

          // Register new device
          await setDoc(
            userRef,
            {
              devices: arrayUnion({
                deviceId,
                addedAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
              }),
            },
            { merge: true }
          );
        }
      } catch (firestoreError) {
        // If Firestore is blocked (ERR_BLOCKED_BY_CLIENT), don't stop the login process entirely
        // but log the warning.
        console.warn(
          "Firestore device check failed (likely blocked):",
          firestoreError
        );

        // If it's the security limit error, we still want to throw it
        if (firestoreError.message.includes("limit reached")) {
          throw firestoreError;
        }
      }
    }

    return userCredential;
  }

  async function signup(email, password) {
    if (!auth) {
      throw new Error("Firebase configuration is missing. Cannot sign up.");
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Register the first device
    if (db) {
      try {
        const deviceId = getDeviceId();
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          email: user.email,
          createdAt: new Date().toISOString(),
          devices: [
            {
              deviceId,
              addedAt: new Date().toISOString(),
              userAgent: navigator.userAgent,
            },
          ],
        });
      } catch (firestoreError) {
        console.warn(
          "Initial device registration failed (Firestore blocked):",
          firestoreError
        );
      }
    }

    return userCredential;
  }

  async function resetPassword(email) {
    if (!auth) {
      throw new Error(
        "Firebase configuration is missing. Cannot reset password."
      );
    }
    return sendPasswordResetEmail(auth, email);
  }

  async function removeDevice(deviceId) {
    if (!auth || !currentUser || !db) {
      throw new Error(
        "Cannot remove device: missing configuration or not authenticated."
      );
    }

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const devices = userSnap.data().devices || [];
      const updatedDevices = devices.filter((d) => d.deviceId !== deviceId);

      await updateDoc(userRef, {
        devices: updatedDevices,
      });

      // Note: The removed device will be automatically logged out
      // within 30 seconds by the periodic validation check,
      // or immediately when they perform any action that triggers auth state change
    }
  }

  async function getUserDevices() {
    if (!auth || !currentUser || !db) {
      return [];
    }

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().devices || [];
    }

    return [];
  }

  async function logout() {
    if (!auth) return;

    try {
      // Remove the current device from the backend before signing out
      // This ensures the device slot is freed up
      const deviceId = getDeviceId();
      if (currentUser && deviceId) {
        await removeDevice(deviceId);
      }
    } catch (error) {
      console.error("Error removing device during logout:", error);
      // We continue to sign out even if device removal fails
    }

    return signOut(auth);
  }

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    removeDevice,
    getUserDevices,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
