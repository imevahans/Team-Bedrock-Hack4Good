import express from "express";
import { registerUser, loginUser } from "../services/authService.js";

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await registerUser(email, password, role);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
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
    res.status(401).json({ error: error.message });
  }
});

export default router;
