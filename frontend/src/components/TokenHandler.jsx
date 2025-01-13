import { useEffect, useState } from "react";
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
  const [tokenProcessed, setTokenProcessed] = useState(false); // Track if the token is already processed
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token && !tokenProcessed) {
      console.log("TokenHandler: Received token:", token);

      const payload = decodeJwt(token);
      console.log("TokenHandler: Decoded token payload:", payload);

      if (payload) {
        login(token);
        setTokenProcessed(true); // Mark the token as processed

        if (payload.role === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else if (payload.role === "resident") {
          navigate("/resident-dashboard", { replace: true });
        }

        // Clean the query parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("token");
        window.history.replaceState({}, document.title, newUrl.toString());
      }
    }
  }, [location.search, login, navigate, tokenProcessed]);

  return null;
};

export default TokenHandler;
