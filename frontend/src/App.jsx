import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ResidentDashboard from "./pages/ResidentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LogoutPage from "./pages/LogoutPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import TokenHandler from "./components/TokenHandler"; // Import the TokenHandler
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminVoucher from "./pages/AdminVoucher";
import TestPage from "./pages/testPage";
import AdminProduct from "./pages/AdminProduct";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <TokenHandler /> {/* Add TokenHandler here */}
        <Routes>
          <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/resident-dashboard" element={<ProtectedRoute role="resident"><ResidentDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/admin-voucher" element={<AdminVoucher />} />
          <Route path="/admin-product" element={<AdminProduct />} />
          <Route path="/testpage" element={<TestPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
