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

  // Offline mode: Firebase fired null (failed token check) but we have a stored session.
  // Route using localStorage-backed isSecurityVerified and isLocked.
  if (!currentUser && lastKnownUserId) {
    if (!isSecurityVerified) {
      return <Navigate to="/security-check" replace />;
    }
    if (loading && !config) {
      return (
        <AppLockBootstrapScreen
          title="Preparing App Lock"
          message="Loading your secure PIN screen..."
        />
      );
    }
    if (isLocked && !isUnlockPath) {
      return <Navigate to="/unlock" replace state={{ from: location }} />;
    }
    return children;
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
