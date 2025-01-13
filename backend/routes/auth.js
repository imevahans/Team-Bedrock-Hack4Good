import express from "express";
import passport from "../config/passportConfig.js"; // Passport configuration
import {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resetPassword,
  sendOtpReset,
} from "../services/authService.js";

const router = express.Router();

/**
 * Route: Send OTP to a phone number
 * Method: POST
 * Body: { phoneNumber: string }
 */
router.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required." });
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
    return res.status(400).json({ error: "All fields are required." });
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
    return res.status(400).json({ error: "Email and password are required." });
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

/**
 * Route: Send OTP for password reset
 * Method: POST
 * Body: { phoneNumber: string }
 */
router.post("/reset-password/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  try {
    const result = await sendOtpReset(phoneNumber);
    res.status(200).json({ message: "OTP sent successfully.", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Route: Verify OTP and reset password
 * Method: POST
 * Body: { phoneNumber: string, otp: string, newPassword: string, confirmPassword: string }
 */
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

/**
 * Google Authentication Routes
 */

// Google Login Route
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/login-failed" }),
  (req, res) => {
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // Default to frontend
    const token = req.user.token; // JWT token generated in passportConfig.js
    const role = req.user.role; // User role from Google or database

    // Redirect based on the role
    const redirectUrl =
      role === "admin"
        ? `${frontendBaseUrl}/admin-dashboard?token=${token}`
        : `${frontendBaseUrl}/resident-dashboard?token=${token}`;

    console.log("Login successful. Redirecting to:", redirectUrl);
    res.redirect(redirectUrl); // Redirect to the appropriate frontend dashboard
  }
);

// Optional: Handle login failure
router.get("/login-failed", (req, res) => {
  res.status(401).json({ message: "Google login failed. Please try again." });
});

/**
 * Route: Logout the user
 * Method: GET
 */
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/");
  });
});


router.get("/resident/vouchers", (req, res) => {
  res.status(200).json({ vouchers: [] }); // Return dummy data for now
});


export default router;