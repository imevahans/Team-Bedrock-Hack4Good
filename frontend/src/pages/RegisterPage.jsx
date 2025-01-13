import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm password field
  const [phoneNumber, setPhoneNumber] = useState(""); // Phone number field
  const [otp, setOtp] = useState(""); // OTP input
  const [role, setRole] = useState("resident"); // Default role
  const [otpSent, setOtpSent] = useState(false); // OTP status
  const [message, setMessage] = useState(""); // Message for feedback
  const [cooldown, setCooldown] = useState(0); // Cooldown for resend OTP
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      await api.post("/auth/send-otp", { phoneNumber });
      setOtpSent(true);
      setCooldown(60); // Set cooldown to 60 seconds (1 minute)
      setMessage("OTP sent to your phone!");
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to send OTP.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await api.post("/auth/register", { email, password, phoneNumber, role, otp });
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/"); // Redirect to login page
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Registration failed.");
    }
  };

  // Cooldown timer for Resend OTP button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000);

      return () => clearInterval(timer); // Cleanup interval on unmount
    }
  }, [cooldown]);

  const goToLogin = () => {
    navigate("/"); // Redirect to the login page
  };

  return (
    <div>
      <form onSubmit={handleRegister}>
        <h2>Register</h2>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        {!otpSent && (
          <button type="button" onClick={handleSendOtp}>
            Send OTP
          </button>
        )}
        {otpSent && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={cooldown > 0}
              style={{ marginLeft: "10px" }}
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </>
        )}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="resident">Resident</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Register</button>
        {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}
      </form>
      <p>
        Already have an account?{" "}
        <button onClick={goToLogin} style={{ color: "blue", cursor: "pointer", border: "none", background: "none" }}>
          Log in here
        </button>
      </p>
    </div>
  );
};

export default RegisterPage;
