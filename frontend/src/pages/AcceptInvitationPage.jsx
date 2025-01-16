import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";

const AcceptInvitationPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState(""); // User's name
  const [contactMethod, setContactMethod] = useState("email"); // Email or phone
  const [otpSent, setOtpSent] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email"); // Default email from URL
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    // Fetch the user's name using the email
    const fetchUserName = async () => {
      try {
        const response = await api.get("/auth/user-details", { params: { email } });
        setName(response.data.name);
      } catch (error) {
        console.error("Error fetching user details:", error.response?.data?.error || error.message);
        setName("Guest");
      }
    };

    if (email) {
      fetchUserName();
    }
  }, [email]);

  const handleSendOtp = async () => {
    try {
      const endpoint =
        contactMethod === "email"
          ? "/auth/accept-invitation/send-email-otp"
          : "/auth/accept-invitation/send-otp";

      const response = await api.post(endpoint, { email });
      setOtpSent(true);
      showNotification(response.data.message, "success");
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to send OTP.", "error");
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      const response = await api.post("/auth/accept-invitation", {
        email,
        password,
        confirmPassword,
        otp,
        method: contactMethod,
      });
      showNotification(response.data.message, "success");

      // Start redirect countdown
      setRedirecting(true);
      const countdown = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdown);
            navigate("/"); // Redirect to login
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to accept invitation.", "error");
    }
  };

  return (
    <div>
      <h2>Accept Invitation</h2>
      <p style={{ color: "white" }}>Hello, {name}!</p>
      <p style={{ color: "white" }}>Email: {email}</p>

      {!otpSent ? (
        <div>
          <label>
            OTP Delivery Method:
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </label>
          <button onClick={handleSendOtp}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={handleAcceptInvitation}>Set Password</button>
        </div>
      )}
      {redirecting && <p>Redirecting to login in {redirectCountdown} seconds...</p>}
    </div>
  );
};

export default AcceptInvitationPage;
