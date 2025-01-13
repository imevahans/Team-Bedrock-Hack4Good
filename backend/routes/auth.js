import express from "express";
import { registerUser, loginUser, sendOtp, verifyOtp, resetPassword, sendOtpReset } from "../services/authService.js";

const router = express.Router();

/**
 * Route: Send OTP to a phone number
 * Method: POST
 * Body: { phoneNumber: string }
 */
router.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    await sendOtp(phoneNumber);
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

/**
 * Route: Register a new user with OTP verification
 * Method: POST
 * Body: { email: string, password: string, phoneNumber: string, role: string, otp: string }
 */
router.post("/register", async (req, res) => {
  const { email, password, phoneNumber, role, otp } = req.body;

  if (!email || !password || !phoneNumber || !role || !otp) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Verify OTP
    await verifyOtp(phoneNumber, otp);

    // Register the user
    const user = await registerUser(email, password, phoneNumber, role);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(400).json({ error: "Registration failed: " + error.message });
  }
});

/**
 * Route: Login a user
 * Method: POST
 * Body: { email: string, password: string }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await loginUser(email, password);
    console.log("results = ", result);
    res.status(200).json({ message: "Login successful", token: result.token, role: result.role });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(401).json({ error: error.message });
  }
});

router.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  try {
    await sendOtp(phoneNumber);
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(429).json({ error: error.message }); // 429 Too Many Requests
  }
});

// Send OTP for password reset
// Send OTP
router.post("/reset-password/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  try {
    const result = await sendOtpReset(phoneNumber); // Only use phone number
    res.status(200).json({ message: "OTP sent successfully.", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify OTP and reset password
router.post("/reset-password/verify", async (req, res) => {
  const { phoneNumber, otp, newPassword, confirmPassword } = req.body;

  if (!phoneNumber || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  try {
    await resetPassword(phoneNumber, otp, newPassword);
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;