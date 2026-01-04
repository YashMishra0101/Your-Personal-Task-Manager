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

    try {
      // 2. Authenticate with Firebase
      // Standard auth check (handles checking if user exists)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 3. Check Device Restrictions
      if (db) {
        try {
          const deviceId = getDeviceId();
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          let devices = [];
          if (userSnap.exists()) {
            devices = userSnap.data().devices || [];
          }

          const isRegistered = devices.find((d) => d.deviceId === deviceId);

          if (!isRegistered) {
            if (devices.length >= 2) {
              // STRICT LIMIT REACHED: Custom generic security message
              await signOut(auth);
              throw new Error("You cannot log in due to security rules.");
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
          // Propagate our custom security error
          if (
            firestoreError.message ===
            "You cannot log in due to security rules."
          ) {
            throw firestoreError;
          }
          console.warn("Firestore device check failed:", firestoreError);
        }
      }
      return userCredential;
    } catch (error) {
      // Standardize error messages as requested
      if (error.message === "You cannot log in due to security rules.") {
        throw error;
      }
      // For any other auth error (wrong password, user not found, etc.)
      throw new Error("Invalid credentials.");
    }
  }

  async function signup(email, password) {
    // Disable signup completely as only one user is allowed
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
