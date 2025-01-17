import express from "express";
import multer from "multer";
import fs from "fs";
import {
  loginUser,
  sendOtp,
  verifyOtp,
  sendOtpEmail,
  verifyOtpEmail,
  resetPassword,
  sendOtpReset,
  getAllUsers,
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
  editProduct,
  createProduct,
  deleteProduct,
  getAuditLogs,
  getAuditActions,
  buyProduct,
  uploadImageToCloudinary,
  getAllVoucherTasks,
  createVoucherTask,
  approveVoucherTask,
  rejectVoucherTask,
  markRequestAsFulfilled,
  fetchUnfulfilledRequests,
  preOrderProduct,
  editVoucherTask,
  deleteVoucherTask,
  attemptVoucherTask,
  fetchUserAttempts,
  getPendingVoucherApprovals,
  fetchUserAttemptHistory
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

    // Check if user is suspended
    if (result.suspended) {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }

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


// Suspend user
router.post("/suspend-user", async (req, res) => {
  const { email, adminName, adminEmail } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    await suspendUser(email, adminName, adminEmail);
    res.status(200).json({ message: "User suspended successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to suspend user." });
  }
});

// Suspend user
router.post("/unsuspend-user", async (req, res) => {
  const { email, adminName, adminEmail } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    await unsuspendUser(email, adminName, adminEmail);
    res.status(200).json({ message: "User suspended successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to suspend user." });
  }
});

// Reset password by admin route
router.post("/reset-password-admin", async (req, res) => {
  const { email, name, adminName, adminEmail } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required." });
  }

  try {
    await resetPasswordByAdmin(email, name, adminName, adminEmail); // Send the reset password email
    res.status(200).json({ message: "Password reset email sent successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to send password reset email." });
  }
});


// Update user role and phone number
router.post("/update-user", async (req, res) => {
  const { name, email, role, phoneNumber, confirmation, adminName, adminEmail } = req.body;

  if (!email || confirmation !== "yes") {
    return res.status(400).json({ error: "Email and confirmation are required." });
  }

  try {
    await updateUser(name, email, role, phoneNumber, adminName, adminEmail);
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
  const { adminName, adminEmail } = req.body; // Get admin details from the formData
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    console.log("req.file.path = ", req.file.path);
    const result = await bulkAddUsers(req.file.path, adminName, adminEmail); // Corrected: req.file.path
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
  console.log("req.body = ", req.body);

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
    res.status(200).json({ 
      name: user.name,
      balance: user.balance,
    });
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(500).json({ error: "Failed to fetch user details." });
  }
});


router.post("/add-user-manual", async (req, res) => {
  const { email, phoneNumber, name, role, adminName, adminEmail } = req.body;

  if (!email || !phoneNumber || !name || !role) {
    return res.status(400).json({ error: "Email, phone number, name, and role are required." });
  }

  try {
    const user = await addUserManually(email, phoneNumber, name, role, adminName, adminEmail);
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

// Route to update product quantity
router.post("/products/edit", upload.single("image"), async (req, res) => {
  const { originalName, name, quantity, price, adminName, adminEmail, imageUrl } = req.body;

  if (!name || !quantity || !price) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    let newImageUrl = imageUrl;

    if (req.file) {
      // Reupload the new image to Cloudinary
      newImageUrl = await uploadImageToCloudinary(req.file.path);
    }

    const result = await editProduct(originalName, name, price, quantity, newImageUrl, adminName, adminEmail);

    // Return success message
    res.status(200).json(result);
  } catch (error) {
    console.error("Error editing product:", error.message);
    res.status(500).json({ error: "Failed to update product." });
  }
});



// Route to create a new product
router.post("/products/create", upload.single("image"), async (req, res) => {
  const { name, price, quantity, adminName, adminEmail } = req.body;
  const image = req.file
  console.log("image = ", image);
  console.log("image.path = ", image.path);
  if (!name || !price || !quantity || !image) {
    return res.status(400).json({ error: "Product name, price, quantity, and image are required." });
  }
  try {
    const result = await createProduct(name, price, quantity, image.path, adminName, adminEmail); // Pass the image file path
    res.status(200).json({ message: "Product created successfully.", product: result });
  } catch (error) {
    console.error("Error creating product:", error.message);
    res.status(500).json({ error: "Failed to create product." });
  }
});

// Route to delete a product
router.delete("/products/delete", async (req, res) => {
  const { productName, adminName, adminEmail } = req.body;

  if (!productName) {
    return res.status(400).json({ error: "Product name is required." });
  }

  try {
    const result = await deleteProduct(productName, adminName, adminEmail); // Make sure deleteProduct is being used here
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

router.post("/products/buy", async (req, res) => {
  const { productName, quantity, userEmail } = req.body;

  if (!productName || !quantity || !userEmail) {
    return res.status(400).json({
      error: "Product name, quantity, and user email are required.",
    });
  }

  try {
    const result = await buyProduct(productName, quantity, userEmail);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error buying product:", error.message);
    if (error.message === "Product not found.") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "Insufficient balance.") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to process the purchase." });
    }
  }
});


// Endpoint to get audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await getAuditLogs(); // Call the service function
    res.status(200).json({ logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error.message);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

router.get("/audit-actions", async (req, res) => {
  try {
    const actions = await getAuditActions(); // Call a service function to get actions
    res.status(200).json({ actions });
  } catch (error) {
    console.error("Error fetching audit actions:", error.message);
    res.status(500).json({ error: "Failed to fetch audit actions" });
  }
});

// Fetch unfulfilled product requests
router.get("/requests/unfulfilled", async (req, res) => {
  try {
    const requests = await fetchUnfulfilledRequests();
    res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching unfulfilled requests:", error.message);
    res.status(500).json({ error: "Failed to fetch unfulfilled requests." });
  }
});

// Mark a request as fulfilled
router.post("/requests/mark-fulfilled/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const { adminName, adminEmail } = req.body;

  console.log("requestId = ", requestId);

  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required." });
  }

  try {
    await markRequestAsFulfilled(requestId, adminName, adminEmail);
    res.status(200).json({ message: "Request marked as fulfilled." });
  } catch (error) {
    console.error("Error marking request as fulfilled:", error.message);
    res.status(500).json({ error: "Failed to mark request as fulfilled." });
  }
});


router.get("/vouchers/tasks", async (req, res) => {
  try {
    const tasks = await getAllVoucherTasks();
    console.log("tasks.attempts = ",tasks.attempts);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch voucher tasks." });
  }
});

router.post("/vouchers/create", async (req, res) => {
  const { title, description, maxAttempts, points, adminName, adminEmail } = req.body;
  try {
    await createVoucherTask(title, description, maxAttempts, points, adminName, adminEmail);
    res.status(201).json({ message: "Voucher task created." });
  } catch (error) {
    res.status(500).json({ error: "Failed to create voucher task." });
  }
});

router.post("/vouchers/approve-attempt/:id", async (req, res) => {
  const { id } = req.params; // attemptId
  const { adminName, adminEmail } = req.body;
  try {
    await approveVoucherTask(id, adminName, adminEmail);
    res.status(200).json({ message: "Attempt approved successfully." });
  } catch (error) {
    console.error("Error approving attempt:", error.message);
    res.status(500).json({ error: "Failed to approve attempt." });
  }
});

router.post("/vouchers/reject-attempt/:id", async (req, res) => {
  const { id } = req.params; // attemptId
  const { adminName, adminEmail } = req.body;
  try {
    await rejectVoucherTask(id, adminName, adminEmail);
    res.status(200).json({ message: "Attempt rejected successfully." });
  } catch (error) {
    console.error("Error rejecting attempt:", error.message);
    res.status(500).json({ error: "Failed to reject attempt." });
  }
});


router.post("/vouchers/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, maxAttempts, points, adminName, adminEmail } = req.body;
  try {
    await editVoucherTask(id, title, description, maxAttempts, points, adminName, adminEmail);
    res.status(200).json({ message: "Task updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task." });
  }
});

router.delete("/vouchers/delete/:id", async (req, res) => {
  const { id } = req.params;
  const { adminName, adminEmail } = req.body;
  try {
    await deleteVoucherTask(id, adminName, adminEmail);
    res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task." });
  }
});

router.post("/products/preorder", async (req, res) => {
  const { productName, quantity, userEmail } = req.body;

  if (!productName || !quantity || !userEmail) {
    return res.status(400).json({
      error: "Product name, quantity, and user email are required.",
    });
  }

  try {
    // Call the pre-order function
    const result = await preOrderProduct(productName, quantity, userEmail);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error placing pre-order:", error.message);
    if (error.message === "Product not found.") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to place pre-order." });
    }
  }
});

router.post("/resident/vouchers/attempt", upload.single("image"), async (req, res) => {
  const { taskId, userEmail, userName } = req.body;
  const image = req.file;

  if (!taskId || !userEmail || !image) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const result = await attemptVoucherTask(taskId, userEmail, image.path, userName);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error attempting voucher task:", error.message);
    res.status(500).json({ error: "Failed to attempt voucher task." });
  }
});

router.get("/vouchers/attempts", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "User email is required." });
  }

  try {
    const result = await fetchUserAttempts(email);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching attempts:", error.message);
    res.status(500).json({ error: "Failed to fetch attempts." });
  }
});


router.get("/vouchers/pending-approvals", async (req, res) => {
  try {
    const pendingApprovals = await getPendingVoucherApprovals();
    res.status(200).json(pendingApprovals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error.message);
    res.status(500).json({ error: "Failed to fetch pending approvals." });
  }
});

router.get("/resident/vouchers/attempt-history", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "User email is required." });
  }

  try {
    const history = await fetchUserAttemptHistory(email);
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching attempt history:", error.message);
    res.status(500).json({ error: "Failed to fetch attempt history." });
  }
});














export default router;