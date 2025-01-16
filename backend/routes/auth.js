import express from "express";
import multer from "multer";
import fs from "fs";
import {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  sendOtpEmail,
  verifyOtpEmail,
  resetPassword,
  sendOtpReset,
  getAllUsers,
  addUser,
  suspendUser,
  unsuspendUser,
  resetPasswordByAdmin,
  updateUser,
  searchUsersByEmail,
  bulkAddUsers,
  acceptInvitation,
  generateExcelTemplate,
  getUserByEmail,
  addUserManually,
  getDashboardStats,
  createBasicAdminAccount,
  sendEmailOtp,
  verifyEmailOtp,
  getAllProducts,
  updateProductName,
  updateProductQuantity,
  updateProductPrice
} from "../services/authService.js";

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer instance
const upload = multer({ storage });

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

router.post("/reset-password/send-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const response = await sendEmailOtp(email);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password/verify-email-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  const result = verifyEmailOtp(email, otp);

  if (result.valid) {
    res.status(200).json({ message: result.message });
  } else {
    res.status(400).json({ error: result.message });
  }
});


/**
 * Route: Logout the user
 * Method: GET
 */
router.get("/logout", (req, res) => {
  try {
    // Instruct the client to clear the token
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ error: "Failed to logout." });
  }
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

// Suspend user
router.post("/unsuspend-user", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    await unsuspendUser(email);
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

// Generate Excel Template
router.get("/download-template", (req, res) => {
  try {
    const filePath = generateExcelTemplate();
    res.download(filePath, "user_template.xlsx", (err) => {
      if (err) {
        console.error("Error downloading template:", err);
        res.status(500).json({ error: "Failed to download template." });
      } else {
        fs.unlink(filePath, () => {}); // Clean up temporary file
      }
    });
  } catch (error) {
    console.error("Error generating template:", error.message);
    res.status(500).json({ error: "Failed to generate template." });
  }
});

// Apply Multer to the route
router.post("/bulk-add-users", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const result = await bulkAddUsers(req.file.path); // Corrected: req.file.path
    res.status(200).json({
      message: `${result.users.length} users added successfully.`,
      users: result.users,
      failedEntries: result.failedEntries,
    });
  } catch (error) {
    console.error("Error bulk adding users:", error.message);
    res.status(500).json({ error: "Failed to process bulk upload." });
  }
});


// Accept invitation and set password
router.post("/accept-invitation", async (req, res) => {
  const { email, password, confirmPassword, otp, method } = req.body;

  if (!email || !password || !confirmPassword || !otp || !method) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  try {
    // Verify OTP based on method
    if (method === "email") {
      await verifyEmailOtp(email, otp);
    } else if (method === "phone") {
      await verifyOtpEmail(email, otp);
    } else {
      return res.status(400).json({ error: "Invalid OTP method." });
    }

    // Accept invitation and set password
    await acceptInvitation(email, password);
    res.status(200).json({ message: "Invitation accepted successfully." });
  } catch (error) {
    console.error("Error accepting invitation:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// Send OTP for invitation acceptance
router.post("/accept-invitation/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    await sendOtpEmail(email);
    res.status(200).json({ message: "OTP sent to registered phone number." });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch user details by email
router.get("/user-details", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const user = await getUserByEmail(email); // Ensure this function exists in your authService
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ name: user.name });
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(500).json({ error: "Failed to fetch user details." });
  }
});


router.post("/add-user-manual", async (req, res) => {
  const { email, phoneNumber, name, role } = req.body;

  if (!email || !phoneNumber || !name || !role) {
    return res.status(400).json({ error: "Email, phone number, name, and role are required." });
  }

  try {
    const user = await addUserManually(email, phoneNumber, name, role);
    res.status(201).json({ message: "User added successfully.", user });
  } catch (error) {
    console.error("Error adding user manually:", error.message);
    res.status(500).json({ error: "Failed to add user manually." });
  }
});


router.get("/dashboard-stats", async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
});

router.post("/testpage", async (req, res) => {
  try {
    const stats = await createBasicAdminAccount();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error creating basic admin account:", error.message);
    res.status(500).json({ error: "Failed to fetch basic admin acconut." });
  }
});

// Send email OTP
router.post("/accept-invitation/send-email-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const response = await sendEmailOtp(email);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Route to update product name
router.post("/products/edit-name", async (req, res) => {
  const { productName, newName } = req.body;

  if (!productName || !newName) {
    return res.status(400).json({ error: "Product Name and new name are required." });
  }

  try {
    const result = await updateProductName(productName, newName);
    
    // Check if the update was successful, adjust this logic based on the backend response
    if (result.error) {
      return res.status(404).json({ error: "Product not found." });
    }
    
    // Send a success message with the updated product name or any other relevant information
    return res.status(200).json({ message: "Product name updated successfully." });
  } catch (error) {
    console.error("Error updating product name:", error.message);
    return res.status(500).json({ error: "Failed to update product name." });
  }
});

// Route to update product quantity
router.post("/products/edit-quantity", async (req, res) => {
  const { productName, newQuantity } = req.body;

  if (!productName || !newQuantity) {
    return res.status(400).json({ error: "Product Name and new quantity are required." });
  }

  try {
    const result = await updateProductQuantity(productName, newQuantity);

    // If product not found, return error
    if (result.error) {
      return res.status(404).json(result);  // Product not found
    }

    // Return success message
    res.status(200).json({ message: "Product quantity updated successfully." });
  } catch (error) {
    console.error("Error updating product quantity:", error.message);
    res.status(500).json({ error: "Failed to update product quantity." });
  }
});


// Route to update product price
router.post("/products/edit-price", async (req, res) => {
  const { productName, newPrice } = req.body;

  if (!productName || !newPrice) {
    return res.status(400).json({ error: "Product Name and new price are required." });
  }

  try {
    const result = await updateProductPrice(productName, newPrice);
    if (result.error) {
      return res.status(404).json(result);  // Product not found
    }
    res.status(200).json(result);  // Success message
  } catch (error) {
    console.error("Error updating product price:", error.message);
    res.status(500).json({ error: "Failed to update product price." });
  }
});

export default router;