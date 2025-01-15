import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ResetPasswordPage = () => {
  const [contact, setContact] = useState(""); // For email or phone
  const [method, setMethod] = useState("email"); // Default to email
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false); // Track OTP status
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false); // Error state
  const navigate = useNavigate();

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
      setMessage(response.data.message);
      setError(false);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to send OTP.");
      setError(true);
    }
  };

  // Reset password with OTP
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setError(true);
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

      setMessage(response.data.message);
      setError(false);
      setTimeout(() => {
        navigate("/"); // Redirect to login page
      }, 2000); // Delay to show success message
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to reset password.");
      setError(true);
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
      {message && (
        <p
          style={{
            color: error ? "red" : "green",
            marginTop: "10px",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ResetPasswordPage;
