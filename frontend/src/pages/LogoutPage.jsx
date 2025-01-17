import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    console.log("Logging out...");
    showNotification("Logging out...", "success")
    logout();
    navigate("/"); // Redirect to login page
  }, [logout, navigate]);

  return <div>Logging out...</div>;
};

export default LogoutPage;
