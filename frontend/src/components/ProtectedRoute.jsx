import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth"; // Hook to access AuthContext

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) {
    console.log("ProtectedRoute - Redirecting to login.");
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    console.log(`ProtectedRoute - Role mismatch: ${user.role}`);
    return <Navigate to="/" replace />;
  }

  return children; // Render the protected page if the user is authorized
};

export default ProtectedRoute;
