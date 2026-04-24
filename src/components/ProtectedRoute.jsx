import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppLock } from "../context/AppLockContext";
import AppLockBootstrapScreen from "./AppLockBootstrapScreen";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { currentUser, isSecurityVerified, authLoading, lastKnownUserId } = useAuth();
  const { config, loading, isLocked } = useAppLock();
  const isUnlockPath =
    location.pathname === "/unlock" || location.pathname === "/forgot-pin";

  // Show loading while Firebase Auth is resolving
  if (authLoading) {
    return <AppLockBootstrapScreen />;
  }

  // Timeout fired before onAuthStateChanged resolved (offline edge case):
  // currentUser is still null but lastKnownUserId proves user WAS logged in.
  // Keep showing the loading screen — onAuthStateChanged WILL fire shortly.
  if (!currentUser && lastKnownUserId) {
    return <AppLockBootstrapScreen />;
  }

  // Genuinely not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but security key not verified, redirect to check page
  if (!isSecurityVerified) {
    return <Navigate to="/security-check" replace />;
  }

  if (isUnlockPath) {
    return children;
  }

  if (loading && !config) {
    return (
      <AppLockBootstrapScreen
        title="Preparing App Lock"
        message="Loading your secure PIN screen..."
      />
    );
  }

  if (isLocked) {
    return <Navigate to="/unlock" replace state={{ from: location }} />;
  }

  return children;
}
