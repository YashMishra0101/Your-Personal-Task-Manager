import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { generatePinSalt, hashPin, verifyPin } from "../lib/pinSecurity";

const AppLockContext = createContext();

const LOCK_OPTIONS = {
  every_open: { label: "Every app open", ttlMs: 0, useSession: false },
  on_close: { label: "After app/browser close", ttlMs: 0, useSession: true },
  h6: { label: "6 hours", ttlMs: 6 * 60 * 60 * 1000, useSession: false },
  h24: { label: "24 hours", ttlMs: 24 * 60 * 60 * 1000, useSession: false },
  m1: { label: "1 month", ttlMs: 30 * 24 * 60 * 60 * 1000, useSession: false },
  m2: { label: "2 months", ttlMs: 60 * 24 * 60 * 60 * 1000, useSession: false },
  m3: { label: "3 months", ttlMs: 90 * 24 * 60 * 60 * 1000, useSession: false },
};

const UNLOCKED_UNTIL_KEY = "appLockUnlockedUntil";
const SESSION_UNLOCKED_KEY = "appLockUnlockedSession";

export function useAppLock() {
  const value = useContext(AppLockContext);
  if (!value) throw new Error("useAppLock must be used inside AppLockProvider");
  return value;
}

export function AppLockProvider({ children }) {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const userId = currentUser?.uid || null;

  const appLockDocRef = useMemo(() => {
    if (!userId || !db) return null;
    return doc(db, "applock", userId);
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      if (!userId || !db) {
        setConfig(null);
        setIsUnlocked(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const snap = await getDoc(appLockDocRef);
        const incoming = snap.exists()
          ? snap.data()
          : {
              enabled: false,
              lockMode: "every_open",
              pinLength: 4,
              pinHash: null,
              pinSalt: null,
            };
        setConfig(incoming);
      } catch (error) {
        console.error("Failed to load app lock config:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [appLockDocRef, userId]);

  useEffect(() => {
    if (!config?.enabled) {
      setIsUnlocked(true);
      return;
    }

    const mode = LOCK_OPTIONS[config.lockMode] || LOCK_OPTIONS.every_open;
    if (mode.useSession) {
      setIsUnlocked(sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "1");
      return;
    }

    if (mode.ttlMs > 0) {
      const unlockedUntil = Number(localStorage.getItem(UNLOCKED_UNTIL_KEY) || 0);
      setIsUnlocked(unlockedUntil > Date.now());
      return;
    }

    setIsUnlocked(false);
  }, [config]);

  const applyUnlockWindow = (lockMode) => {
    const mode = LOCK_OPTIONS[lockMode] || LOCK_OPTIONS.every_open;
    localStorage.removeItem(UNLOCKED_UNTIL_KEY);
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);

    if (mode.useSession) {
      sessionStorage.setItem(SESSION_UNLOCKED_KEY, "1");
      return;
    }

    if (mode.ttlMs > 0) {
      localStorage.setItem(UNLOCKED_UNTIL_KEY, String(Date.now() + mode.ttlMs));
    }
  };

  const verifyIdentity = async ({ method, secret }) => {
    if (!currentUser || !db) return false;
    if (!secret?.trim()) return false;

    if (method === "password") {
      const credential = EmailAuthProvider.credential(currentUser.email, secret);
      await reauthenticateWithCredential(currentUser, credential);
      return true;
    }

    if (method === "security_key") {
      const securitySnap = await getDoc(doc(db, "security", "key"));
      if (!securitySnap.exists()) return false;
      return securitySnap.data().securityKey === secret;
    }

    return false;
  };

  const setOrUpdatePin = async ({ pin, pinLength, lockMode, enable }) => {
    if (!appLockDocRef || !pin || ![4, 6, 8].includes(pin.length)) return false;

    const salt = generatePinSalt();
    const pinHash = await hashPin(pin, salt);
    const nextConfig = {
      enabled: !!enable,
      pinLength,
      lockMode,
      pinSalt: salt,
      pinHash,
      updatedAt: serverTimestamp(),
    };

    await setDoc(appLockDocRef, nextConfig, { merge: true });
    setConfig((prev) => ({
      ...(prev || {}),
      ...nextConfig,
    }));
    setIsUnlocked(true);
    applyUnlockWindow(lockMode);
    return true;
  };

  const disableAppLock = async () => {
    if (!appLockDocRef) return false;
    const nextConfig = {
      enabled: false,
      updatedAt: serverTimestamp(),
    };
    await setDoc(appLockDocRef, nextConfig, { merge: true });
    setConfig((prev) => ({
      ...(prev || {}),
      ...nextConfig,
    }));
    setIsUnlocked(true);
    localStorage.removeItem(UNLOCKED_UNTIL_KEY);
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    return true;
  };

  const unlockWithPin = async (pin) => {
    if (!config?.enabled || !config?.pinSalt || !config?.pinHash) return false;
    const valid = await verifyPin(pin, config.pinSalt, config.pinHash);
    if (!valid) return false;

    setIsUnlocked(true);
    applyUnlockWindow(config.lockMode);
    return true;
  };

  const lockNow = () => {
    setIsUnlocked(false);
    localStorage.removeItem(UNLOCKED_UNTIL_KEY);
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  };

  const value = useMemo(
    () => ({
      config,
      loading,
      isLocked: !!config?.enabled && !isUnlocked,
      isUnlocked,
      lockOptions: LOCK_OPTIONS,
      verifyIdentity,
      setOrUpdatePin,
      disableAppLock,
      unlockWithPin,
      lockNow,
    }),
    [config, loading, isUnlocked]
  );

  return (
    <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
  );
}
