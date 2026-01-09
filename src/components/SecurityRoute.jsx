import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { auth } from "../lib/firebase";

/**
 * SecurityRoute - Protects the security-check page
 * Only allows access if user is authenticated with email/password
 * Redirects to login if not authenticated
 * Allows access regardless of security key verification status
 */
export default function SecurityRoute({ children }) {
  const { currentUser } = useAuth();

  // Only check if user is logged in (has email/password auth)
  // Don't check security verification - that's what this page is for!
  // Check auth.currentUser directly to handle race conditions where navigation
  // happens before context updates.
  if (!currentUser && !auth?.currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
