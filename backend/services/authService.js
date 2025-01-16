import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import driver from "../database/neo4j.js";
import twilio from "twilio";
import xlsx from "xlsx";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import neo4j from 'neo4j-driver';
import cloudinary from 'cloudinary';

dotenv.config();

const otpStorage = new Map();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken);

const JWT_SECRET = process.env.JWT_SECRET;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createVerification(phoneNumber) {
  const verification = await client.verify.v2
    .services(serviceSID)
    .verifications.create({
      channel: "sms",
      to: phoneNumber,
    });

  console.log(verification.status);
  return verification;
}

async function createVerificationCheck(userCode, phoneNumber) {
  const verificationCheck = await client.verify.v2
    .services(serviceSID)
    .verificationChecks.create({
      code: userCode,
      to: phoneNumber,
    });

  console.log(verificationCheck.status);
  return verificationCheck;
}

// Format timestamp in GMT+8
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  // Adjust for GMT+8 (8 hours ahead of UTC)
  const gmt8Offset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const gmt8Date = new Date(date.getTime() + gmt8Offset);

  return gmt8Date.toISOString().replace("T", " ").split(".")[0]; // Format: YYYY-MM-DD HH:mm:ss
};

export const logAuditAction = async (name, email, action, details) => {
  const session = driver.session();
  const timestamp = formatTimestamp(Date.now());

  try {
    const result = await session.run(
      `
      CREATE (a:Audit {
        userName: $name,
        userEmail: $email,
        action: $action,
        details: $details,
        timestamp: $timestamp
      })
      RETURN a
      `,
      { name, email, action, details, timestamp }
    );

    console.log("Audit log created:", result.records[0].get("a").properties);
  } catch (error) {
    console.error("Error logging audit action:", error.message);
  } finally {
    await session.close();
  }
};


// Login a user
export const loginUser = async (email, password) => {
  const session = driver.session();
  try {
    // Retrieve the passwordHash, salt, role, and suspended status for the user
    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u.passwordHash AS passwordHash, u.salt AS salt, u.role AS role, u.suspended AS suspended, u.name AS name",
      { email }
    );

    if (result.records.length === 0) {
      throw new Error("User or Password incorrect.");
    }

    const { passwordHash, role, suspended, name } = result.records[0].toObject();

    // Verify the password by comparing it with the stored hash
    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      throw new Error("User or Password incorrect.");
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ email, role, name }, JWT_SECRET, { expiresIn: "1h" });

    if (suspended) {
      logAuditAction(name, email, "Login", "is suspended but tried logging in.");
    } else {
      logAuditAction(name, email, "Login", "has logged in.");
    }

    return { token, role, suspended }; // Return suspended status along with token and role
  } finally {
    await session.close();
  }
};


export const sendOtp = async (phoneNumber) => {
  phoneNumber = "+65" + phoneNumber; // Prefix with country code if needed

  try {
    const verification = await createVerification(phoneNumber); // Send OTP via Twilio
    console.log(`OTP sent to ${phoneNumber}:`, verification.status);

    logAuditAction("System", "", "OTP", `OTP has been sent to ${phoneNumber}.`);

    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
    logAuditAction("System", "", "OTP", `OTP has failed to send to ${phoneNumber} due to ${error.message}.`);
    console.error("Error sending OTP:", error.message);
    throw new Error("Failed to send OTP. Please try again.");
  }
};

export const verifyOtp = async (phoneNumber, otp) => {
  phoneNumber = "+65" + phoneNumber; // Prefix with country code if needed

  try {
    const verificationCheck = await createVerificationCheck(otp, phoneNumber);
    console.log(`OTP verification status for ${phoneNumber}:`, verificationCheck.status);

    if (verificationCheck.status !== "approved") {
      logAuditAction("System", "", "OTP", `OTP has failed verification for ${phoneNumber}.`);
      throw new Error("Invalid or expired OTP.");
    }
    logAuditAction("System", "", "OTP", `OTP has verified for ${phoneNumber}.`);
    return { success: true, message: "OTP verified successfully." };
  } catch (error) {
    logAuditAction("System", "", "OTP", `Error verifying OTP for ${phoneNumber} due to ${error.message}.`);
    console.error("Error verifying OTP:", error.message);
    throw new Error("Invalid or expired OTP.");
  }
};

export const sendOtpEmail = async (email) => {
  const session = driver.session();
  try {
    // Fetch user's phone number based on email
    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u.phoneNumber AS phoneNumber",
      { email }
    );

    if (result.records.length === 0) {
      throw new Error("User not found.");
    }

    const phoneNumber = result.records[0].get("phoneNumber");
    const fullPhoneNumber = `+65${phoneNumber}`;

    const verification = await createVerification(fullPhoneNumber); // Send OTP via Twilio
    logAuditAction("System", "", "OTP", `OTP has been sent to ${fullPhoneNumber}.`);
    console.log(`OTP sent to ${fullPhoneNumber}:`, verification.status);
    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
    logAuditAction("System", "", "OTP", `OTP has failed to send to ${fullPhoneNumber} due to ${error.message}.`);
    console.error("Error sending OTP:", error.message);
    throw new Error("Failed to send OTP. Please try again.");
  }
};

export const verifyOtpEmail = async (email, otp) => {
  const session = driver.session();
  try {

    // Fetch user's phone number based on email
    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u.phoneNumber AS phoneNumber",
      { email }
    );

    if (result.records.length === 0) {
      throw new Error("User not found.");
    }

    const phoneNumber = result.records[0].get("phoneNumber");
    const fullPhoneNumber = `+65${phoneNumber}`;
    const verificationCheck = await createVerificationCheck(otp, fullPhoneNumber);
    
    console.log(`OTP verification status for ${fullPhoneNumber}:`, verificationCheck.status);

    if (verificationCheck.status !== "approved") {
      logAuditAction("System", "", "OTP", `OTP has failed verification for ${fullPhoneNumber}.`);
      throw new Error("Invalid or expired OTP.");
    }
    logAuditAction("System", "", "OTP", `OTP has verified for ${fullPhoneNumber}.`);
    return { success: true, message: "OTP verified successfully." };
  } catch (error) {
    logAuditAction("System", "", "OTP", `Error verifying OTP for ${fullPhoneNumber} due to ${error.message}.`);
    console.error("Error verifying OTP:", error.message);
    throw new Error("Invalid or expired OTP.");
  }
};

export const sendOtpReset = async (phoneNumber) => {
  const session = driver.session();
  try {
    let result;

    console.log("phoneNumber = ", phoneNumber);
    result = await session.run(
      "MATCH (u:User {phoneNumber: $phoneNumber}) RETURN u.phoneNumber AS phoneNumber, u.email AS email",
      { phoneNumber }
    );

    if (result.records.length === 0) {
      throw new Error("User not found.");
    }

    console.log("sendOtpReset result = ", result.records);

    const userPhoneNumber = "+65" + result.records[0].get("phoneNumber");
    console.log("userPhoneNumber = ", userPhoneNumber);

    // Send OTP to phoneNumber using Twilio
    const verification = await client.verify.v2
      .services(serviceSID)
      .verifications.create({ channel: "sms", to: userPhoneNumber });
    
      logAuditAction("System", "", "OTP", `OTP has been sent to ${userPhoneNumber} to reset password`);
    console.log(`OTP sent to ${userPhoneNumber}:`, verification.status);
    return verification;
  } finally {
    await session.close();
  }
};

export const resetPassword = async (phoneNumber, otp, newPassword) => {
  console.log("resetPassword phoneNumber = ", phoneNumber);
  const oldPhoneNumber = phoneNumber;
  phoneNumber = "+65" + phoneNumber; // Adjust country code if needed

  // Verify OTP
  const verificationCheck = await client.verify.v2
    .services(serviceSID)
    .verificationChecks.create({ code: otp, to: phoneNumber });

  if (verificationCheck.status !== "approved") {
    logAuditAction("System", "", "OTP", `OTP has failed verification for ${phoneNumber}.`);
    throw new Error("Invalid or expired OTP.");
  }

  logAuditAction("System", "", "OTP", `OTP has verified for ${phoneNumber} to reset password.`);
  console.log("Reset OTP Passed!");

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  const updatedAt = formatTimestamp(Date.now());
  const session = driver.session();
  try {
    // Update password in Neo4j
    const result = await session.run(
      `
      MATCH (u:User {phoneNumber: $oldPhoneNumber})
      SET u.passwordHash = $passwordHash, u.updatedAt = $updatedAt
      RETURN u.email AS email, u.name AS name
      `,
      { oldPhoneNumber, passwordHash, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("Failed to reset password.");
    }

    const { email, name } = result.records[0].toObject()

    console.log("Resetting for.... ", result.records);
    console.log("Password reset successfully.");
    logAuditAction(name, email, "Reset Password", `has sucessfully resetted password.`);

  } finally {
    await session.close();
  }
};

export const getAllUsers = async () => {
  const session = driver.session();
  try {
    const result = await session.run("MATCH (u:User) RETURN u");
    return result.records.map((record) => {
      const user = record.get("u").properties;
      delete user.passwordHash; // Ensure password hash is not exposed
      delete user.salt; // Remove sensitive information
      return user;
    });
  } finally {
    await session.close();
  }
};

export const suspendUser = async (email, adminName, adminEmail) => {
  const session = driver.session();
  try {
    await session.run("MATCH (u:User {email: $email}) SET u.suspended = true", { email });

    // Log audit action
    await logAuditAction(adminName, adminEmail, "Suspend User", `suspended user with email ${email}.`);
  } finally {
    await session.close();
  }
};


export const unsuspendUser = async (email, adminName, adminEmail) => {
  const session = driver.session();
  try {
    await session.run("MATCH (u:User {email: $email}) SET u.suspended = false", { email });

    // Log audit action
    await logAuditAction(adminName, adminEmail, "Unsuspend User", `unsuspended user with email ${email}.`);
  } finally {
    await session.close();
  }
};


// Function to send a reset password link via email
export const resetPasswordByAdmin = async (email, name, adminName, adminEmail) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const mailOptions = {
    to: email,
    subject: "Reset Your Password",
    html: `
      <p>Hello ${name},</p>
      <p>You have requested to reset your password. Please click the link below to reset your password:</p>
      <a href="${frontendUrl}/reset-password?email=${encodeURIComponent(email)}">Reset Password</a>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logAuditAction(adminName, adminEmail, "Update User", `Resetted password for ${name} with email ${email}.`);
    logAuditAction("System", "", "Email", `Sent password reset email to ${name} with email ${email}.`);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send password reset email.");
  }
};


export const updateUser = async (name, email, role, phoneNumber, adminName, adminEmail) => {
  const session = driver.session();
  try {
    const updatedAt = formatTimestamp(Date.now());

    const result = await session.run(
      `
      MATCH (u:User {email: $email})
      SET 
        u.name = $name,
        u.role = COALESCE($role, u.role),
        u.phoneNumber = COALESCE($phoneNumber, u.phoneNumber),
        u.updatedAt = $updatedAt
      RETURN u
      `,
      { name, email, role, phoneNumber, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("User not found.");
    }

    // Log audit action
    await logAuditAction(adminName, adminEmail, "Update User", `updated user with email ${email}.`);

    return result.records[0].get("u").properties;
  } finally {
    await session.close();
  }
};


export const searchUsersByEmail = async (searchTerm) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User) 
      WHERE u.email CONTAINS $searchTerm
      RETURN u
      `,
      { searchTerm }
    );
    return result.records.map((record) => {
      const user = record.get("u").properties;
      delete user.passwordHash;
      delete user.salt;
      return user;
    });
  } finally {
    await session.close();
  }
};

// Bulk add users from Excel
export const bulkAddUsers = async (filePath, adminName, adminEmail) => {
  const session = driver.session();
  const failedEntries = []; // List to track failed entries

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const users = [];
    for (const row of data) {
      try {
        console.log("Raw row = ", row);

        // Normalize column names
        const name = row["Name"];
        const email = row["Email"];
        const phoneNumber = row["Phone Number (without +65 and spaces)"];
        let role = row["Role (resident/admin)"];

        if (!name || !email || !phoneNumber || !role) {
          failedEntries.push({ row, error: "Invalid data format." });
          continue;
        }

        // Normalize and validate role
        role = role.toLowerCase();
        if (role !== "resident" && role !== "admin") {
          failedEntries.push({ row, error: "Invalid role. Must be 'resident' or 'admin'." });
          continue;
        }

        // Check for duplicate email in the database
        const existingUser = await session.run(
          "MATCH (u:User {email: $email}) RETURN u",
          { email }
        );

        if (existingUser.records.length > 0) {
          failedEntries.push({ row, error: `Email ${email} already exists.` });
          continue;
        }

        // Save user to database
        const createdAt = formatTimestamp(Date.now());
        const updatedAt = createdAt;

        const result = await session.run(
          `
          CREATE (u:User {
            name: $name,
            email: $email,
            phoneNumber: $phoneNumber,
            role: $role,
            invitationAccepted: false,
            createdAt: $createdAt,
            updatedAt: $updatedAt
          })
          RETURN u
          `,
          { name, email, phoneNumber, role, createdAt, updatedAt }
        );

        const user = result.records[0].get("u").properties;
        users.push(user);

        // Send invitation email
        await sendInvitationEmail(email, name);
        logAuditAction(adminName, adminEmail, "Bulk User Creation", `User with email ${email} created via bulk upload.`);
      } catch (error) {
        console.error("Error processing row:", row, error.message);
        failedEntries.push({ row, error: error.message });
      }
    }

    fs.unlinkSync(filePath); // Clean up uploaded file
    return { users, failedEntries };
  } finally {
    await session.close();
  }
};


// Send invitation email
const sendInvitationEmail = async (email, name) => {
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const mailOptions = {
    to: email,
    subject: "Welcome to the Minimart!",
    html: `
      <p>Hello ${name},</p>
      <p>Welcome to the Minimart! Please click the link below to accept your invitation and set your password:</p>
      <a href="${frontendUrl}/accept-invitation?email=${encodeURIComponent(email)}">Accept Invitation</a>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  logAuditAction("System", "", "Email", `Sent invitation email to ${name} with email ${email}.`);

  console.log("Message sent: %s", info.messageId);
};

// Accept invitation and set password
export const acceptInvitation = async (email, password) => {
  const session = driver.session();

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const updatedAt = formatTimestamp(Date.now());

    // Match the user by email and check if the invitation is not accepted
    const result = await session.run(
      `
      MATCH (u:User {email: $email, invitationAccepted: false})
      SET u.passwordHash = $passwordHash, u.invitationAccepted = true, u.updatedAt = $updatedAt, u.salt = $salt
      RETURN u.name, u.email
      `,
      { email, passwordHash, updatedAt, salt }
    );

    if (result.records.length === 0) {
      throw new Error("Invalid invitation or user already accepted.");
    }

    // Extract user details (name and email)
    const name = result.records[0].get("u.name");

    // Log the action with admin's details
    await logAuditAction(name, email, "Email", `Accepted invitation email.`);

  } finally {
    await session.close();
  }
};


// Generate Excel Template
export const generateExcelTemplate = () => {
  const headers = [["Name", "Email", "Phone Number (without +65 and spaces)", "Role (resident/admin)"]];
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(headers);
  xlsx.utils.book_append_sheet(workbook, worksheet, "Template");

  const tempDir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true }); // Ensure the temp directory exists
  }

  const filePath = path.join(tempDir, `user_template_${Date.now()}.xlsx`);
  xlsx.writeFile(workbook, filePath);

  return filePath;
};


export const getUserByEmail = async (email) => {
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u.name AS name, u.balance AS balance",
      { email }
    );

    if (result.records.length === 0) {
      return null; // User not found
    }

    const balance = result.records[0].get("balance");
    // Convert balance from a Long to a JavaScript number if necessary
    const balanceAmount = balance.low + balance.high * Math.pow(2, 32);

    return {
      name: result.records[0].get("name"),
      balance: balanceAmount,
    };
  } finally {
    await session.close();
  }
};


export const addUserManually = async (email, phoneNumber, name, role, adminName, adminEmail) => {
  const session = driver.session();
  try {
    const createdAt = formatTimestamp(Date.now());
    const updatedAt = createdAt;
    const result = await session.run(
      `
      CREATE (u:User {
        email: $email,
        phoneNumber: $phoneNumber,
        name: $name,
        role: $role,
        invitationAccepted: false,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN u
      `,
      { email, phoneNumber, name, role, createdAt, updatedAt }
    );
    const user = result.records[0].get("u").properties;
    
    // Log audit action
    await logAuditAction(adminName, adminEmail, "User Creation", `created user with email ${email} as ${role}.`);

    await sendInvitationEmail(email, name);
    return user;
  } finally {
    await session.close();
  }
};



export const getDashboardStats = async () => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (u:User)
      RETURN 
        COUNT(u) AS totalUsers,
        COUNT(CASE WHEN u.invitationAccepted THEN 1 ELSE null END) AS invitationsAccepted,
        COUNT(CASE WHEN NOT u.invitationAccepted THEN 1 ELSE null END) AS invitationsNotAccepted
    `);

    const voucherTasks = await session.run(`
      MATCH (v:VoucherTask)
      RETURN COUNT(v) AS pendingTasks
    `);

    const productRequests = await session.run(`
      MATCH (p:ProductRequest)
      RETURN COUNT(p) AS pendingRequests
    `);

    const stats = {
      currentUsers: result.records[0].get("totalUsers").toInt(),
      invitationsAccepted: result.records[0].get("invitationsAccepted").toInt(),
      invitationsNotAccepted: result.records[0].get("invitationsNotAccepted").toInt(),
      voucherTasksPending: voucherTasks.records[0].get("pendingTasks").toInt(),
      productRequestsPending: productRequests.records[0].get("pendingRequests").toInt(),
    };

    return stats;
  } finally {
    await session.close();
  }
};

export const createBasicAdminAccount = async () => {
  const session = driver.session();
  try {
    const salt = await bcrypt.genSalt(12); // Stronger hash
    const passwordHash = await bcrypt.hash("123", salt);
    const createdAt = formatTimestamp(Date.now());
    const updatedAt = createdAt;
    const email = "admin@a.com";
    const role = "admin";
    const name = "testadmin"

    const result = await session.run(
      `
      CREATE (u:User {
        email: $email,
        name: $name,
        passwordHash: $passwordHash, 
        salt: $salt, 
        role: $role,
        createdAt: $createdAt, 
        updatedAt: $updatedAt,
        suspended: false
      })
      RETURN u
      `,
      { email, name, passwordHash, salt, role, createdAt, updatedAt }
    );
    const user = result.records[0].get("u").properties;
    delete user.passwordHash;
    delete user.salt;
    return user;
  } finally {
    await session.close();
  }
};

// Function to generate OTP
export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
};

// Function to send OTP via email
export const sendEmailOtp = async (email) => {
  const otp = generateOtp(); // Generate OTP
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: email,
    subject: "Your OTP Code",
    html: `
      <p>Hello,</p>
      <p>Your OTP code is <strong>${otp}</strong>.</p>
      <p>Please use this code to complete your action. This code is valid for 10 minutes.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);

    // Store OTP in temporary storage with a timestamp (10-minute expiry)
    otpStorage.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    logAuditAction("System", "", "OTP", `OTP has been sent to ${email}.`);

    return { message: "OTP sent successfully to your email." };
  } catch (error) {
    logAuditAction("System", "", "OTP", `OTP has failed to send to ${email} due to ${error.message}.`);
    console.error("Error sending email OTP:", error);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

export const verifyEmailOtp = (email, submittedOtp) => {
  const storedData = otpStorage.get(email);
  console.log("stored OTP = ", storedData);

  if (!storedData) {
    throw new Error("No OTP found for this email.");;
  }

  const { otp, expiresAt } = storedData;

  if (Date.now() > expiresAt) {
    otpStorage.delete(email); // Remove expired OTP
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (otp === submittedOtp) {
    otpStorage.delete(email); // Remove OTP after successful verification
    logAuditAction("System", "", "OTP", `OTP has verified for ${email}.`);
    return { valid: true, message: "OTP verified successfully." };
  } else {
    logAuditAction("System", "", "OTP", `OTP has failed verification for ${email}.`);
    throw new Error("Invalid OTP. Please try again.");
  }

  
};

export const getAllProducts = async () => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product)
      RETURN p.name AS name, p.price AS price, p.quantity AS quantity
    `);

    // Map the result to return a list of products
    const products = result.records.map(record => {
      const price = record.get('price');
      const quantity = record.get('quantity');

      return {
        name: record.get('name'),
        price: price instanceof neo4j.types.Integer ? price.toNumber() : parseFloat(price),
        quantity: quantity instanceof neo4j.types.Integer ? quantity.toNumber() : parseInt(quantity, 10),
      };
    });

    return products;
  } catch (error) {
    console.error("Error fetching products from Neo4j:", error.message); // Log any errors from Neo4j
    throw error;  // Rethrow the error to be caught by the route handler
  } finally {
    await session.close();
  }
};



// In backend/services/authServices.js

// Function to update product name
export const updateProductName = async (productName, newName) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product {name: $productName})
      SET p.name = $newName
      RETURN p.name AS name
    `, { productName, newName });

    if (result.records.length > 0) {
      return { message: "Product name updated successfully." };
    } else {
      return { error: "Product not found." };
    }
  } finally {
    await session.close();
  }
};

export const updateProductQuantity = async (productName, newQuantity) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product {name: $productName})
      SET p.quantity = $newQuantity
      RETURN p.quantity AS quantity
    `, { productName, newQuantity });

    if (result.records.length > 0) {
      return { message: "Product quantity updated successfully." };
    } else {
      return { error: "Product not found." };
    }
  } finally {
    await session.close();
  }
};


// Function to update product price
export const updateProductPrice = async (productName, newPrice) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product {name: $productName})
      SET p.price = $newPrice
      RETURN p.price AS price
    `, { productName, newPrice });

    if (result.records.length > 0) {
      return { message: "Product price updated successfully." };
    } else {
      return { error: "Product not found." };
    }
  } finally {
    await session.close();
  }
};

export const createProduct = async (name, price, quantity, imageFilePath) => {
  console.log("Triggered");
  const session = driver.session();
  try {
    // Upload image to Cloudinary

    console.log("Triggered4");
    const imageUrl = await uploadImageToCloudinary(imageFilePath);
    console.log("imageURL created = ", imageUrl);

    const createdAt = formatTimestamp(Date.now());
    const updatedAt = createdAt;

    // Create the product with the image URL
    const result = await session.run(
      `
      CREATE (p:Product {
        name: $name,
        price: $price,
        quantity: $quantity,
        imageUrl: $imageUrl,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN p
      `,
      { name, price, quantity, imageUrl, createdAt, updatedAt }
    );

    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
};

export const deleteProduct = async (productName) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product {name: $productName})
      DELETE p
      RETURN p
    `, { productName });

    if (result.records.length > 0) {
      return { message: "Product deleted successfully." };
    } else {
      return { error: "Product not found." };
    }
  } finally {
    await session.close();
  }
};

export const getAuditLogs = async () => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (a:Audit)
      RETURN a.userName, a.userEmail, a.action, a.details, a.timestamp
      ORDER BY a.timestamp DESC
      `
    );

    // Parse the results and map to the correct format
    const logs = result.records.map((record) => {
      return {
        userName: record.get("a.userName"),
        userEmail: record.get("a.userEmail"),
        action: record.get("a.action"),
        details: record.get("a.details"),
        timestamp: record.get("a.timestamp"),
      };
    });

    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error.message);
    throw new Error("Failed to fetch audit logs");
  } finally {
    await session.close();
  }
};

export const getAuditActions = async () => {
  const session = driver.session();
  
  try {
    const result = await session.run(
      "MATCH (a:Audit) RETURN DISTINCT a.action AS action"
    );
    
    const actions = result.records.map((record) => record.get("action"));
    return actions;
  } finally {
    await session.close();
  }
};


// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image function
const uploadImageToCloudinary = async (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, (result, error) => {
      if (error) {
        console.error("Error uploading image to Cloudinary:", error.message);
        reject(error);  // Reject the promise if there’s an error
      } else {
        console.log("Image uploaded successfully. Image URL: ", result.url);
        resolve(result.url);  // Resolve the promise with the URL when upload is successful
      }
    });
  });
};
