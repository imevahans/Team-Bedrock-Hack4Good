import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const AcceptInvitationPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState(""); // State to store the user's name
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5); // Countdown timer
  const [redirecting, setRedirecting] = useState(false); // Redirect state
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the user's name using the email
    const fetchUserName = async () => {
      try {
        const response = await api.get("/auth/user-details", { params: { email } });
        setName(response.data.name);
      } catch (error) {
        console.error("Error fetching user details:", error.response?.data?.error || error.message);
        setName("Guest"); // Fallback if user details can't be fetched
      }
    };

    if (email) {
      fetchUserName();
    }
  }, [email]);

  const handleSendOtp = async () => {
    try {
      const response = await api.post("/auth/accept-invitation/send-otp", { email });
      setOtpSent(true);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to send OTP.");
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      const response = await api.post("/auth/accept-invitation", {
        email,
        password,
        confirmPassword,
        otp,
      });
      setMessage(response.data.message);

      // Start redirect countdown
      setRedirecting(true);
      const countdown = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdown);
            navigate("/"); // Redirect to dashboard
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to accept invitation.");
    }
  };

  return (
    <div>
      <h2>Accept Invitation</h2>
      <p>Hello, {name}!</p> {/* Greet the user by their name */}
      <p>Email: {email}</p>
      {!otpSent ? (
        <button onClick={handleSendOtp}>Send OTP</button>
      ) : (
        <>
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
        </>
      )}
      {message && <p>{message}</p>}
      {redirecting && (
        <p>
          Redirecting to dashboard in {redirectCountdown} seconds...
        </p>
      )}
    </div>
  );
};

export default AcceptInvitationPage;
