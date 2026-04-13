import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppLock } from "../context/AppLockContext";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { currentUser, isSecurityVerified } = useAuth();
  const { loading, isLocked } = useAppLock();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but security key not verified, redirect to check page
  if (!isSecurityVerified) {
    return <Navigate to="/security-check" replace />;
  }

  if (loading) return null;

  if (isLocked && location.pathname !== "/unlock" && location.pathname !== "/forgot-pin") {
    return <Navigate to="/unlock" replace />;
  }

  return children;
}
