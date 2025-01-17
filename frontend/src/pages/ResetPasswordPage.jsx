import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import "../styles/ResetPasswordPage.css";
import minimart from "../assets/minimart.png";
import food from "../assets/food.png";

const ResetPasswordPage = () => {
  const [contact, setContact] = useState(""); // For email or phone
  const [method, setMethod] = useState("email"); // Default to email
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false); // Track OTP status
  const [redirecting, setRedirecting] = useState(false); // Redirect state
  const [redirectCountdown, setRedirectCountdown] = useState(5); // Countdown timer
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Send OTP based on selected method
  const handleSendOtp = async () => {
    try {
      const endpoint =
        method === "email"
          ? "/auth/reset-password/send-email-otp"
          : "/auth/reset-password/send-otp";

      const response = await api.post(endpoint, {
        [method === "email" ? "email" : "phoneNumber"]: contact,
      });
      setOtpSent(true);
      showNotification(response.data.message, "success");
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to send OTP.", "error");
    }
  };

  // Reset password with OTP
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }

    try {
      const endpoint =
        method === "email"
          ? "/auth/reset-password/verify-email-otp"
          : "/auth/reset-password/verify";

      const response = await api.post(endpoint, {
        [method === "email" ? "email" : "phoneNumber"]: contact,
        otp,
        newPassword,
        confirmPassword,
      });

      showNotification(response.data.message, "success");

      // Start redirection timer
      setRedirecting(true);
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate("/"); // Redirect to login page
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to reset password.", "error");
    }
  };

  return (
    <div className="reset-password-page">
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

      {/* Reset Password Section */}
      <div className="reset-container">
        <h2 className="reset-title">Reset Password</h2>
        <div className="method-selection">
          <label className="method-label">
            OTP Delivery Method:
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="method-select"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </label>
        </div>

        {!otpSent ? (
          <>
            <input
              type="text"
              placeholder={
                method === "email" ? "Enter your email" : "Enter your phone number"
              }
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="reset-input"
            />
            <button onClick={handleSendOtp} className="reset-button" disabled={otpSent}>
              Send OTP
            </button>
          </>
        ) : (
          <div className="otp-section">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="reset-input"
            />
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="reset-input"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="reset-input"
            />
            <button onClick={handleResetPassword} className="reset-button">
              Reset Password
            </button>
          </div>
        )}

        {redirecting && (
          <p className="redirect-message">
            Redirecting to login in {redirectCountdown} seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
