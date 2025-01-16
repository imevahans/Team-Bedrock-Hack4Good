import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // Error/Success message
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
    </div>
  );
};

export default LoginPage;
