import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import "../styles/AcceptInvitationPage.css";
import minimart from "../assets/minimart.png";
import food from "../assets/food.png";

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
    <div className="accept-invitation-page">
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

      {/* Main Content */}
      <div className="invitation-container">
        <h2 className="invitation-title">Accept Invitation</h2>
        <p className="invitation-greeting">Hello, {name}!</p>
        <p className="invitation-email">Email: {email}</p>

        {!otpSent ? (
          <div className="otp-section">
            <label className="otp-label">
              OTP Delivery Method:
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value)}
                className="otp-select"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <button className="otp-button" onClick={handleSendOtp}>
              Send OTP
            </button>
          </div>
        ) : (
          <div className="password-section">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="invitation-input"
            />
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="invitation-input"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="invitation-input"
            />
            <button
              className="invitation-button"
              onClick={handleAcceptInvitation}
            >
              Set Password
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

export default AcceptInvitationPage;
