import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // Import RegisterPage
import ResidentDashboard from "./pages/ResidentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import useAuth from "./hooks/useAuth";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  console.log("ProtectedRoute - User:", user); // Debug log

  if (!user) {
    console.log("ProtectedRoute - User not logged in, redirecting to login.");
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    console.log(`ProtectedRoute - Role mismatch (${user.role}), redirecting to login.`);
    return <Navigate to="/" replace />;
  }

  return children;
};



const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> {/* Add this route */}
          <Route
            path="/resident-dashboard"
            element={
              <ProtectedRoute role="resident">
                <ResidentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
