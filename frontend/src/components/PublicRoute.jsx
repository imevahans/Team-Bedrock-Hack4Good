import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth"; // Hook to access AuthContext

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Redirect based on user role
    return user.role === "admin" ? (
      <Navigate to="/admin-dashboard" replace />
    ) : (
      <Navigate to="/resident-dashboard" replace />
    );
  }

  return children; // Render the public page if no user is logged in
};

export default PublicRoute;
