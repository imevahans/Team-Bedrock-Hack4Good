import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // Error/Success message
  const [error, setError] = useState(false); // Error state
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("LoginPage: Attempting login with email:", email);

    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("LoginPage: Login successful, response:", response.data);

      login(response.data.token); // Set user in AuthContext
      setMessage("Login successful!");
      setError(false); // Reset error state on success

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
      setMessage(error.response?.data?.error || "Login failed. Please try again.");
      setError(true); // Set error state to true
    }
  };

  const handleGoogleLogin = () => {
    // Redirect the user to the backend Google login route
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
        {/* Display error or success message */}
        {message && (
          <p style={{ color: error ? "red" : "green", marginTop: "10px" }}>
            {message}
          </p>
        )}
      </form>
      <p>Don't have an account?</p>
      <button onClick={() => navigate("/register")}>Register</button>
      <p>
        Forgot your password?{" "}
        <button
          onClick={() => navigate("/reset-password")}
          style={{ color: "blue", cursor: "pointer", border: "none", background: "none" }}
        >
          Reset it here
        </button>
      </p>
      <hr />
      <button
        onClick={handleGoogleLogin}
        style={{
          background: "#4285F4",
          color: "white",
          padding: "10px",
          border: "none",
          borderRadius: "5px",
          marginTop: "20px",
          cursor: "pointer",
        }}
      >
        Login with Google
      </button>
    </div>
  );
};

export default LoginPage;
