import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import "../styles/LoginPage.css";
import minimart from "../assets/minimart.png"; // Replace with actual path
import food from "../assets/food.png"; // Replace with actual path

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false); // Error state
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("LoginPage: Attempting login with email:", email);
  
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("LoginPage: Login successful, response:", response.data);
  
      // Check if the user is suspended
      if (response.data.suspended) {
        showNotification("Your account has been suspended. Please contact support.", "error");
        setError(true);
        return;
      }
  
      login(response.data.token); // Set user in AuthContext
      showNotification("Login successful!", "success");
      setError(false); // Reset error state on success
  
      // Store email in localStorage
      localStorage.setItem("userEmail", email);
  
      // Redirect to the appropriate dashboard
      if (response.data.role === "admin") {
        console.log("LoginPage: Redirecting to admin dashboard...");
        navigate("/admin-dashboard");
      } else {
        console.log("LoginPage: Redirecting to resident dashboard...");
        navigate("/resident-dashboard");
      }
    } catch (error) {
      console.error("LoginPage: Login failed:", error.response?.data || error.message);
      showNotification(error.response?.data?.error || "Login failed. Please try again.", "error");
      setError(true); // Set error state to true
    }
  };

  return (
    <div className="login-page">
      {/* Header Section */}
      <div className="header-container">
        <h1 className="main-title">
          <img src={minimart} className="dashboard-image" alt="MiniMart" />
          Muhammadiyah Minimart
          <img src={food} className="dashboard-image" alt="Food Icon" />
        </h1>
        <p className="subtitle">
          Your one-stop shop for fresh produce, groceries, and exclusive deals!
        </p>
      </div>

      {/* Login Form */}
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2 className="login-title">Login</h2>
          {error && <p className="login-error">Invalid email or password. Please try again.</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        <p className="login-reset">
          Forgot your password?{" "}
          <button
            onClick={() => navigate("/reset-password")}
            className="reset-link"
          >
            Reset it here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
