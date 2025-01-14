import express from "express";
import {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resetPassword,
  sendOtpReset,
  getAllUsers,
  addUser,
  suspendUser,
  resetPasswordByAdmin,
  updateUser,
  searchUsersByEmail,
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

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// Add new user
router.post("/add-user", async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: "Email and role are required." });
  }
  try {
    const user = await addUser(email, role);
    res.status(201).json({ message: "User added successfully.", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to add user." });
  }
});

// Suspend user
router.post("/suspend-user", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    await suspendUser(email);
    res.status(200).json({ message: "User suspended successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to suspend user." });
  }
});

// Reset password by admin
router.post("/reset-password-admin", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    const newPassword = await resetPasswordByAdmin(email);
    res.status(200).json({ message: `Password reset successfully. New password: ${newPassword}` });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// Update user role and phone number
router.post("/update-user", async (req, res) => {
  const { email, role, phoneNumber, confirmation } = req.body;

  if (!email || confirmation !== "yes") {
    return res.status(400).json({ error: "Email and confirmation are required." });
  }

  try {
    await updateUser(email, role, phoneNumber);
    res.status(200).json({ message: "User details updated successfully." });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user details." });
  }
});


// Search users by email
router.get("/search-users", async (req, res) => {
  const { term } = req.query;
  if (!term) {
    return res.status(400).json({ error: "Search term is required." });
  }
  try {
    const users = await searchUsersByEmail(term);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to search users." });
  }
});


export default router;