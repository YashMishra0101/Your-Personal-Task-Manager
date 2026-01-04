import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getDeviceId } from "../lib/device";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is null (missing config), we just stop loading and don't attach listener.
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
    return signOut(auth);
  }

  const value = {
    currentUser,
    login,
    logout,
    removeDevice,
    getUserDevices,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
