import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ResetPasswordPage = () => {
  const [phoneNumber, setPhoneNumber] = useState(""); // Only phone number is required
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false); // Track OTP status
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false); // Error state
  const navigate = useNavigate(); // To handle navigation

  // Send OTP to phone number
  const handleSendOtp = async () => {
    try {
      const response = await api.post("/auth/reset-password/send-otp", { phoneNumber });
      setOtpSent(true); // Enable OTP and password fields
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
      const response = await api.post("/auth/reset-password/verify", {
        phoneNumber,
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
      <input
        type="text"
        placeholder="Enter your phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        disabled={otpSent} // Disable phone number input after OTP is sent
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
        <p style={{ color: error ? "red" : "green", marginTop: "10px" }}>
          {message}
        </p>
      )}
      <p style={{ marginTop: "20px" }}>
        Remembered your password?{" "}
        <button
          onClick={() => navigate("/")}
          style={{ color: "blue", cursor: "pointer", border: "none", background: "none" }}
        >
          Log in here
        </button>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
