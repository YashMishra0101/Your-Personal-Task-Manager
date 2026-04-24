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
const APP_LOCK_CACHE_PREFIX = "appLockBootstrap:";

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

function getAppLockCacheKey(userId) {
  return `${APP_LOCK_CACHE_PREFIX}${userId}`;
}

function getCachedConfig(userId) {
  if (!userId) return null;

  try {
    const raw = localStorage.getItem(getAppLockCacheKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to parse cached app lock config:", error);
    return null;
  }
}

function persistCachedConfig(userId, config) {
  if (!userId) return;

  if (!config) {
    localStorage.removeItem(getAppLockCacheKey(userId));
    return;
  }

  const cacheableConfig = {
    enabled: !!config.enabled,
    lockMode: config.lockMode || "every_open",
    pinLength: config.pinLength || 4,
  };

  localStorage.setItem(getAppLockCacheKey(userId), JSON.stringify(cacheableConfig));
}

function resolveUnlockedState(config) {
  if (!config?.enabled) return true;

  const mode = LOCK_OPTIONS[config.lockMode] || LOCK_OPTIONS.every_open;
  if (mode.useSession) {
    return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "1";
  }

  if (mode.ttlMs > 0) {
    const unlockedUntil = Number(localStorage.getItem(UNLOCKED_UNTIL_KEY) || 0);
    return unlockedUntil > Date.now();
  }

  return false;
}

export function useAppLock() {
  const value = useContext(AppLockContext);
  if (!value) throw new Error("useAppLock must be used inside AppLockProvider");
  return value;
}

export function AppLockProvider({ children }) {
  const { currentUser, lastKnownUserId } = useAuth();
  const bootstrapUserId = currentUser?.uid || lastKnownUserId || null;
  const remoteUserId = currentUser?.uid || null;
  const initialCachedConfig = getCachedConfig(bootstrapUserId);
  const [config, setConfig] = useState(initialCachedConfig);
  const [loading, setLoading] = useState(
    () => !!bootstrapUserId && !initialCachedConfig
  );
  const [isUnlocked, setIsUnlocked] = useState(() =>
    bootstrapUserId
      ? initialCachedConfig
        ? resolveUnlockedState(initialCachedConfig)
        : false
      : true
  );

  const appLockDocRef = useMemo(() => {
    if (!remoteUserId || !db) return null;
    return doc(db, "applock", remoteUserId);
  }, [remoteUserId]);

  useEffect(() => {
    const cachedConfig = getCachedConfig(bootstrapUserId);

    const load = async () => {
      if (!bootstrapUserId || !db) {
        setConfig(null);
        setIsUnlocked(true);
        setLoading(false);
        return;
      }

      if (cachedConfig) {
        setConfig(cachedConfig);
        setIsUnlocked(resolveUnlockedState(cachedConfig));
        setLoading(false);
      } else {
        setConfig(null);
        setIsUnlocked(false);
        setLoading(true);
      }

      // Offline or no Firebase user yet — cannot fetch remotely.
      // Trust the local cache (already applied above) and release loading.
      if (!remoteUserId || !appLockDocRef) {
        setLoading(false); // ← critical: was missing, caused infinite loading offline
        return;
      }

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
        persistCachedConfig(remoteUserId, incoming);
        setConfig(incoming);
        setIsUnlocked(resolveUnlockedState(incoming));
      } catch (error) {
        console.error("Failed to load app lock config:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [appLockDocRef, bootstrapUserId, remoteUserId]);

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
    persistCachedConfig(remoteUserId, nextConfig);
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
    persistCachedConfig(remoteUserId, nextConfig);
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
      canUnlock: !!config?.enabled && !!config?.pinSalt && !!config?.pinHash,
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
