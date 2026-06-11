import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, getDashboardRoute } from "../../context/AuthContext";
import { getAccessToken } from "../../services/authSession";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && !getAccessToken()) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Normalization helper to map casing/punctuation differences cleanly
  const normalize = (r) => r ? r.toUpperCase().replace(/[\s_\-/]/g, "") : "";
  const normalizedUserRole = normalize(currentUser.role);

  // Admins / System Admins have full access override
  const isAdmin = normalizedUserRole.includes("ADMIN");

  const isAllowed = allowedRoles ? allowedRoles.some(ar => {
    const normAllowed = normalize(ar);
    return normAllowed === normalizedUserRole ||
           (normAllowed.startsWith("IT") && normalizedUserRole.startsWith("IT")) ||
           (normAllowed.includes("HR") && normalizedUserRole.includes("HR")) ||
           (normAllowed.includes("MANAGER") && normalizedUserRole.includes("MANAGER"));
  }) : true;

  if (allowedRoles && !isAllowed && !isAdmin) {
    // Redirect unauthorized users to their correct dashboard
    const userDashboard = getDashboardRoute(currentUser.role);
    return <Navigate to={userDashboard} replace />;
  }

  return children;
}
