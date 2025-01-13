// src/components/TokenHandler.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Invalid JWT", error);
    return null;
  }
};

const TokenHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      console.log("TokenHandler: Received token:", token);

      const payload = decodeJwt(token);
      console.log("TokenHandler: Decoded token payload:", payload);

      login(token);

      if (payload?.role === "admin") {
        navigate("/admin-dashboard");
      } else if (payload?.role === "resident") {
        navigate("/resident-dashboard");
      }
    }
  }, [location.search, login, navigate]);

  return null; // No UI, just logic
};

export default TokenHandler;
