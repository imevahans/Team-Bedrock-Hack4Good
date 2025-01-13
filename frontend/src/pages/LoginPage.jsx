import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Use login from AuthContext

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.token); // Set user in AuthContext
      setMessage("Login successful!");
      // Redirect to the appropriate dashboard
      if (response.data.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/resident-dashboard");
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "Login failed");
    }
  };

  const goToRegister = () => {
    navigate("/register");
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
        {message && <p>{message}</p>}
      </form>
      <p>Don't have an account?</p>
      <button onClick={goToRegister}>Register</button>
    </div>
  );
};

export default LoginPage;
