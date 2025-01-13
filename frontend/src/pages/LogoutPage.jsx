import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Logging out...");
    logout();
    navigate("/"); // Redirect to login page
  }, [logout, navigate]);

  return <div>Logging out...</div>;
};

export default LogoutPage;
