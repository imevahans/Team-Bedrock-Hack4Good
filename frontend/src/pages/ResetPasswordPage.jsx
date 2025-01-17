import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import "../styles/ResetPasswordPage.css";

const ResetPasswordPage = () => {
  const [contact, setContact] = useState(""); // For email or phone
  const [method, setMethod] = useState("email"); // Default to email
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false); // Track OTP status
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
      setTimeout(() => {
        navigate("/"); // Redirect to login page
      }, 2000); // Delay to show success message
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to reset password.", "error");
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <div style={{ marginBottom: "20px" }}>
        <label>
          OTP Delivery Method:
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </label>
      </div>
      <input
        type="text"
        placeholder={method === "email" ? "Enter your email" : "Enter your phone number"}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        disabled={otpSent}
      />
      <button onClick={handleSendOtp} disabled={otpSent}>
        Send OTP
      </button>
      {otpSent && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={handleResetPassword}>Reset Password</button>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;
