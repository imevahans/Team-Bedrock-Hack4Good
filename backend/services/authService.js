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
import { log } from "util";

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
        const balance = 100;
        const result = await session.run(
          `
          CREATE (u:User {
            name: $name,
            email: $email,
            phoneNumber: $phoneNumber,
            role: $role,
            invitationAccepted: false,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            balance: $balance
          })
          RETURN u
          `,
          { name, email, phoneNumber, role, createdAt, updatedAt, balance }
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
    return {
      name: result.records[0].get("name"),
      balance: balance,
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
    const balance = 100; // Give each user $100 first
    const result = await session.run(
      `
      CREATE (u:User {
        email: $email,
        phoneNumber: $phoneNumber,
        name: $name,
        role: $role,
        invitationAccepted: false,
        createdAt: $createdAt,
        updatedAt: $updatedAt,
        balance: $balance
      })
      RETURN u
      `,
      { email, phoneNumber, name, role, createdAt, updatedAt, balance }
    );
    const user = result.records[0].get("u").properties;
    
    // Log audit action
    await logAuditAction(adminName, adminEmail, "User Creation", `created user with email ${email} as ${role} and balance of ${balance}.`);

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
      MATCH (v:VoucherTask)-[c:COMPLETED_BY]->(u:User)
      WHERE c.status = "pending"
      RETURN COUNT(c) AS pendingTasks
    `);
    

    const productRequests = await session.run(`
      MATCH (u:User)-[r:PURCHASED {fulfilled: false}]->(p:Product)
      RETURN COUNT(r) AS pendingRequests
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
      RETURN p.name AS name, p.price AS price, p.quantity AS quantity, p.imageUrl AS imageUrl
      ORDER BY p.name ASC
    `);

    return result.records.map(record => ({
      name: record.get('name'),
      price: parseFloat(record.get('price')),
      quantity: parseInt(record.get('quantity'), 10),
      imageUrl: record.get('imageUrl'),
    }));
  } finally {
    await session.close();
  }
};


export const editProduct = async (originalName, name, price, quantity, imageUrl, adminName, adminEmail) => {
  const session = driver.session();
  try {
    const updatedAt = formatTimestamp(Date.now());

    const result = await session.run(
      `
      MATCH (p:Product {name: $originalName})
      SET p.name = $name,
          p.price = $price,
          p.quantity = $quantity,
          p.updatedAt = $updatedAt,
          p.imageUrl = $imageUrl
      RETURN p
      `,
      { originalName, name, price, quantity, updatedAt, imageUrl }
    );

    if (result.records.length > 0) {
      // Log the action
      await logAuditAction(
        adminName,
        adminEmail,
        "Edit",
        `Edited product ${originalName}: updated name to ${name}, price to $${price}, quantity to ${quantity}, and image URL.`
      );

      return { message: "Product updated successfully." };
    } else {
      return { error: "Product not found." };
    }
  } catch (error) {
    console.error("Error editing product:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};



export const createProduct = async (name, price, quantity, imageFilePath, adminName, adminEmail) => {
  const session = driver.session();
  try {
    // Upload image to Cloudinary

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

    logAuditAction(adminName, adminEmail, "Create", `created ${quantity} piece(s) of product ${name} at ${price} dollars each.`);
    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
};

export const deleteProduct = async (productName, adminName, adminEmail) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Product {name: $productName})
      DELETE p
      RETURN p
    `, { productName });

    if (result.records.length > 0) {
      logAuditAction(adminName, adminEmail, "Delete", `deleted product ${productName}.`);
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
export const uploadImageToCloudinary = async (filePath) => {
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


export const updateProductQuantity = async (productName, newQuantity) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (p:Product {name: $productName})
      SET p.quantity = $newQuantity
      RETURN p
      `,
      { productName, newQuantity }
    );

    if (result.records.length === 0) {
      throw new Error("Product not found.");
    }

    return { message: "Product quantity updated successfully." };
  } catch (error) {
    console.error("Error updating product quantity:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};

export const updateUserBalance = async (userEmail, deductionAmount) => {
  const session = driver.session();
  try {
    const userResult = await session.run(
      `
      MATCH (u:User {email: $userEmail})
      RETURN u.balance AS currentBalance
      `,
      { userEmail }
    );

    if (userResult.records.length === 0) {
      throw new Error("User not found.");
    }

    // Convert balance to a number
    const currentBalance = Number(userResult.records[0].get("currentBalance"));

    if (isNaN(currentBalance)) {
      throw new Error("Invalid balance format.");
    }

    // Calculate updated balance and round to 2 decimal places
    const updatedBalance = Math.round((currentBalance - deductionAmount) * 100) / 100;

    // Update the balance in the database
    const result = await session.run(
      `
      MATCH (u:User {email: $userEmail})
      SET u.balance = $updatedBalance
      RETURN u
      `,
      { userEmail, updatedBalance }
    );

    if (result.records.length === 0) {
      throw new Error("Failed to update balance.");
    }

    return { message: "User balance updated successfully." };
  } catch (error) {
    console.error("Error updating user balance:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};



export const buyProduct = async (productName, quantity, userEmail) => {
  const session = driver.session();

  try {
    // Fetch product details
    const productResult = await session.run(`
      MATCH (p:Product {name: $productName})
      RETURN p.price AS price, p.quantity AS quantity
    `, { productName });

    if (productResult.records.length === 0) {
      throw new Error("Product not found.");
    }

    const price = Number(productResult.records[0].get("price"));
    const currentQuantity = Number(productResult.records[0].get("quantity"));

    if (quantity > currentQuantity) {
      throw new Error("Requested quantity exceeds available stock.");
    }

    const totalPrice = Math.round(price * quantity * 100) / 100; // Ensure 2 decimal places

    // Check user balance
    const userResult = await session.run(`
      MATCH (u:User {email: $userEmail})
      RETURN u.balance AS balance, u.name AS name
    `, { userEmail });

    if (userResult.records.length === 0) {
      throw new Error("User not found.");
    }

    const userBalance = Number(userResult.records[0].get("balance"));
    const userName = userResult.records[0].get("name");

    if (userBalance < totalPrice) {
      throw new Error("Insufficient balance.");
    }

    // Update product quantity
    await updateProductQuantity(productName, currentQuantity - quantity);

    // Deduct user balance
    await updateUserBalance(userEmail, totalPrice);

    // Create a new purchase relationship
    await session.run(`
      MATCH (u:User {email: $userEmail}), (p:Product {name: $productName})
      CREATE (u)-[r:PURCHASED]->(p)
      SET r.quantity = $quantity, r.fulfilled = false, r.createdAt = $createdAt
      RETURN r
    `, {
      userEmail,
      productName,
      quantity,
      createdAt: formatTimestamp(Date.now()),
    });

    // Log the purchase
    logAuditAction(userName, userEmail, "Buy", `Purchased ${quantity} piece(s) of ${productName} for $${totalPrice}.`);
    return { message: "Product purchased successfully." };
  } finally {
    await session.close();
  }
};



export const fetchUnfulfilledRequests = async () => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (u:User)-[r:PURCHASED {fulfilled: false}]->(p:Product)
      RETURN 
        u.name AS userName, 
        u.email AS userEmail, 
        p.name AS productName, 
        r.quantity AS quantity, 
        r.createdAt AS createdAt, 
        elementId(r) AS requestId
    `);

    return result.records.map((record) => ({
      userName: record.get("userName"),
      userEmail: record.get("userEmail"),
      productName: record.get("productName"),
      quantity: record.get("quantity"),
      createdAt: record.get("createdAt"),
      requestId: record.get("requestId"),
    }));
  } finally {
    await session.close();
  }
};

export const markRequestAsFulfilled = async (requestId, adminName, adminEmail) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH ()-[r:PURCHASED]->()
      WHERE elementId(r) = $requestId
      SET r.fulfilled = true
      RETURN r
    `, { requestId });

    if (result.records.length === 0) {
      throw new Error("Request not found.");
    }

    await logAuditAction(
      adminName,
      adminEmail,
      "Mark Fulfilled",
      `Marked request ${requestId} as fulfilled.`
    );
  } finally {
    await session.close();
  }
};


export const getAllVoucherTasks = async () => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (v:VoucherTask)
      OPTIONAL MATCH (v)-[c:COMPLETED_BY]->(u:User)
      RETURN 
        v.title AS title,
        v.description AS description,
        v.maxAttempts AS maxAttempts,
        v.points AS points,
        v.createdAt AS createdAt,
        v.updatedAt AS updatedAt,
        v.status AS status,
        elementId(v) AS id,
        COLLECT({
          userName: u.name,
          userEmail: u.email,
          imageProofUrl: c.imageProofUrl,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          status: c.status
        }) AS attempts
    `);

    return result.records.map((record) => ({
      id: record.get("id"),
      title: record.get("title"),
      description: record.get("description"),
      maxAttempts: record.get("maxAttempts"),
      points: record.get("points"),
      createdAt: record.get("createdAt"),
      updatedAt: record.get("updatedAt"),
      status: record.get("status"),
      attempts: record.get("attempts") || [], // List of attempts for this task
    }));
  } finally {
    await session.close();
  }
};


export const createVoucherTask = async (title, description, maxAttempts, points, adminName, adminEmail) => {
  const session = driver.session();
  const createdAt = formatTimestamp(Date.now());
  const updatedAt = createdAt;

  try {
    const result = await session.run(
      `
      CREATE (v:VoucherTask {
        title: $title,
        description: $description,
        maxAttempts: $maxAttempts,
        points: $points,
        createdAt: $createdAt,
        updatedAt: $updatedAt,
        status: "active"
      })
      RETURN v
      `,
      { title, description, maxAttempts, points, createdAt, updatedAt }
    );

    const voucher = result.records[0].get("v").properties;
    await logAuditAction(adminName, adminEmail, "Create Voucher Task", `Created voucher task: ${JSON.stringify(voucher)}.`);
  } finally {
    await session.close();
  }
};


export const approveVoucherTask = async (attemptId, adminName, adminEmail) => {
  const session = driver.session();
  const updatedAt = formatTimestamp(Date.now());

  try {
    // Step 1: Retrieve the task, user, and attempt details
    const result = await session.run(
      `
      MATCH (v:VoucherTask)-[c:COMPLETED_BY]->(u:User)
      WHERE elementId(c) = $attemptId
      SET c.status = "approved", c.updatedAt = $updatedAt
      RETURN v.title AS taskTitle, v.description AS taskDescription, v.points AS taskPoints,
             u.name AS userName, u.email AS userEmail, c.imageProofUrl AS imageProofUrl, u.balance AS currentBalance
      `,
      { attemptId, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("Attempt not found.");
    }

    const taskTitle = result.records[0].get("taskTitle");
    const taskDescription = result.records[0].get("taskDescription");
    const taskPoints = result.records[0].get("taskPoints");
    const userName = result.records[0].get("userName");
    const userEmail = result.records[0].get("userEmail");
    const imageProofUrl = result.records[0].get("imageProofUrl");
    const currentBalance = result.records[0].get("currentBalance");

    // Convert the balance and add points
    const newBalance = Number(currentBalance) + Number(taskPoints);

    // Step 2: Update the user's balance
    await session.run(
      `
      MATCH (u:User {email: $userEmail})
      SET u.balance = $newBalance
      `,
      { userEmail, newBalance }
    );

    // Step 3: Log the action
    await logAuditAction(
      adminName,
      adminEmail,
      "Approve Voucher Task",
      `Approved voucher task "${taskTitle}" (${taskDescription}, ${taskPoints} points) for user ${userName} (${userEmail}). Proof: ${imageProofUrl}. New Balance: ${newBalance}.`
    );

    return {
      message: `Task approved and ${taskPoints} points credited to ${userName}'s balance.`,
      newBalance,
    };
  } catch (error) {
    console.error("Error approving voucher task:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};




export const rejectVoucherTask = async (attemptId, adminName, adminEmail) => {
  const session = driver.session();
  const updatedAt = formatTimestamp(Date.now());

  try {
    const result = await session.run(
      `
      MATCH (v:VoucherTask)-[c:COMPLETED_BY]->(u:User)
      WHERE elementId(c) = $attemptId
      SET c.status = "rejected", c.updatedAt = $updatedAt
      RETURN v.title AS taskTitle, v.description AS taskDescription, v.points AS taskPoints,
             u.name AS userName, u.email AS userEmail, c.imageProofUrl AS imageProofUrl
      `,
      { attemptId, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("Attempt not found.");
    }

    const taskTitle = result.records[0].get("taskTitle");
    const taskDescription = result.records[0].get("taskDescription");
    const taskPoints = result.records[0].get("taskPoints").low || 0; // Handle Neo4j integers
    const userName = result.records[0].get("userName");
    const userEmail = result.records[0].get("userEmail");
    const imageProofUrl = result.records[0].get("imageProofUrl");

    await logAuditAction(
      adminName,
      adminEmail,
      "Reject Voucher Task",
      `Rejected voucher task "${taskTitle}" (${taskDescription}, ${taskPoints} points) for user ${userName} (${userEmail}). Proof: ${imageProofUrl}.`
    );
  } finally {
    await session.close();
  }
};




export const editVoucherTask = async (id, title, description, maxAttempts, points, adminName, adminEmail) => {
  const session = driver.session();
  const updatedAt = formatTimestamp(Date.now());

  try {
    const result = await session.run(
      `
      MATCH (v:VoucherTask)
      WHERE elementId(v) = $id
      SET 
        v.title = $title,
        v.description = $description,
        v.maxAttempts = $maxAttempts,
        v.points = $points,
        v.updatedAt = $updatedAt
      RETURN v
      `,
      { id, title, description, maxAttempts, points, updatedAt }
    );

    const voucher = result.records[0].get("v").properties;

    await logAuditAction(adminName, adminEmail, "Edit Voucher Task", `Edited voucher task: ${JSON.stringify(voucher)}.`);
  } finally {
    await session.close();
  }
};


export const deleteVoucherTask = async (id, adminName, adminEmail) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (v:VoucherTask)
      WHERE elementId(v) = $id
      RETURN v
      `,
      { id }
    );

    if (result.records.length === 0) {
      throw new Error(`Voucher task with ID ${id} not found.`);
    }

    const voucher = result.records[0].get("v").properties;

    await session.run(
      `
      MATCH (v:VoucherTask)
      WHERE elementId(v) = $id
      DELETE v
      `,
      { id }
    );

    await logAuditAction(adminName, adminEmail, "Delete Voucher Task", `Deleted voucher task: ${JSON.stringify(voucher)}.`);
  } finally {
    await session.close();
  }
};

export const preOrderProduct = async (productName, quantity, userEmail, price, userName) => {
  const session = driver.session();
  const createdAt = formatTimestamp(Date.now());
  const updatedAt = createdAt;
  const totalPrice = Number(price) * Number(quantity);

  try {
    // Deduct user balance
    await updateUserBalance(userEmail, totalPrice);

    // Create preorder
    await session.run(`
      CREATE (preOrder:PreOrder {
        userEmail: $userEmail,
        productName: $productName,
        quantity: $quantity,
        totalPrice: $totalPrice,
        status: 'pending',
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN preOrder
    `, {
      userEmail,
      productName,
      quantity,
      totalPrice,
      createdAt,
      updatedAt,
    });

    logAuditAction(userName, userEmail, "PreOrder", `Preordered ${quantity} of ${productName}.`);
    return { message: "Preorder placed successfully." };
  } finally {
    await session.close();
  }
};

export const approvePreOrder = async (preOrderId, adminName, adminEmail) => {
  const session = driver.session();

  try {
    await session.run(`
      MATCH (preOrder:PreOrder)
      WHERE elementId(preOrder) = $preOrderId
      SET preOrder.status = 'approved'
    `, { preOrderId });

    logAuditAction(adminName, adminEmail, "Approve PreOrder", `Approved preorder with ID: ${preOrderId}.`);
  } finally {
    await session.close();
  }
};

export const rejectPreOrder = async (preOrderId, adminName, adminEmail) => {
  const session = driver.session();

  try {
    // Fetch the preorder details
    const preorderResult = await session.run(`
      MATCH (preOrder:PreOrder)
      WHERE elementId(preOrder) = $preOrderId
      RETURN preOrder.userEmail AS userEmail, preOrder.totalPrice AS totalPrice
    `, { preOrderId });

    if (preorderResult.records.length === 0) {
      throw new Error("Preorder not found.");
    }

    const userEmail = preorderResult.records[0].get("userEmail");
    const totalPrice = Number(preorderResult.records[0].get("totalPrice"));

    // Fetch the user's current balance
    const userResult = await session.run(`
      MATCH (u:User {email: $userEmail})
      RETURN u.balance AS currentBalance
    `, { userEmail });

    if (userResult.records.length === 0) {
      throw new Error("User not found.");
    }

    const currentBalance = Number(userResult.records[0].get("currentBalance"));

    // Calculate the updated balance
    const updatedBalance = currentBalance + totalPrice;

    // Update the user's balance
    await session.run(`
      MATCH (u:User {email: $userEmail})
      SET u.balance = $updatedBalance
    `, { userEmail, updatedBalance });

    // Update the preorder status
    await session.run(`
      MATCH (preOrder:PreOrder)
      WHERE elementId(preOrder) = $preOrderId
      SET preOrder.status = 'rejected'
    `, { preOrderId });

    // Log the action
    await logAuditAction(
      adminName,
      adminEmail,
      "Reject PreOrder",
      `Rejected preorder with ID: ${preOrderId}. Refunded $${totalPrice} to user with email ${userEmail}.`
    );
  } catch (error) {
    console.error("Error rejecting preorder:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};



export const attemptVoucherTask = async (taskId, userEmail, imageFilePath, userName) => {
  const session = driver.session();
  const createdAt = formatTimestamp(Date.now());
  const updatedAt = formatTimestamp(Date.now());

  try {
    // Step 1: Upload the image to Cloudinary to get the URL
    const imageUrl = await uploadImageToCloudinary(imageFilePath);
    console.log("Image URL created:", imageUrl);

    // Step 2: Fetch the current number of attempts for the user
    const attemptResult = await session.run(
      `
      MATCH (v:VoucherTask)-[c:COMPLETED_BY]->(u:User {email: $userEmail})
      WHERE elementId(v) = $taskId
      RETURN COUNT(c) AS attemptCount
      `,
      { taskId, userEmail }
    );

    const attemptCount = attemptResult.records[0].get("attemptCount");
    

    // Step 3: Fetch the max attempts for the task
    const taskResult = await session.run(
      `
      MATCH (v:VoucherTask)
      WHERE elementId(v) = $taskId
      RETURN v.maxAttempts AS maxAttempts, v.title AS title, v.description AS description, v.points AS points
      `,
      { taskId }
    );

    if (taskResult.records.length === 0) {
      throw new Error("Task not found.");
    }

    const maxAttempts = taskResult.records[0].get("maxAttempts");
    const taskTitle = taskResult.records[0].get("title");
    const taskDescription = taskResult.records[0].get("description");
    const taskPoints = taskResult.records[0].get("points");
    const status = "pending";

    console.log("attemptCount = ", attemptCount);
    console.log("maxAttempts = ", maxAttempts);
    console.log("taskTitle = ", taskTitle);
    console.log("taskDescription = ", taskDescription);
    console.log("taskPoints = ", taskPoints);

    // Step 4: Check if the user has exceeded the max attempts
    if (attemptCount >= maxAttempts) {
      throw new Error("You have exceeded the maximum number of attempts for this task.");
    }

    // Step 5: Mark the task as attempted
    await session.run(
      `
      MATCH (v:VoucherTask), (u:User {email: $userEmail})
      WHERE elementId(v) = $taskId
      CREATE (v)-[:COMPLETED_BY {createdAt: $createdAt, updatedAt: $updatedAt, imageProofUrl: $imageUrl, status: $status}]->(u)
      `,
      { userEmail, taskId, createdAt, updatedAt, imageUrl, status }
    );

    logAuditAction(userName, userEmail, "Voucher", `has attempted ${taskTitle} (${taskDescription} for ${taskPoints} points.)`);
    return { message: "Task marked as complete. Awaiting admin approval." };
  } catch (error) {
    console.error("Error attempting voucher task:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};


export const fetchUserAttempts = async (email) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (v:VoucherTask)-[c:COMPLETED_BY]->(u:User {email: $email})
      RETURN elementId(v) AS taskId, COUNT(c) AS attemptCount
      `,
      { email }
    );

    const attempts = {};
    result.records.forEach((record) => {
      attempts[record.get("taskId")] = record.get("attemptCount").low;
    });

    return attempts;
  } finally {
    await session.close();
  }
};

export const getPendingVoucherApprovals = async () => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (v:VoucherTask)-[c:COMPLETED_BY {status: "pending"}]->(u:User)
      RETURN 
        elementId(c) AS attemptId,
        v.title AS taskTitle,
        v.description AS taskDescription,
        v.points AS taskPoints,
        u.name AS userName,
        u.email AS userEmail,
        c.imageProofUrl AS imageProofUrl,
        c.createdAt AS attemptCreatedAt
    `);

    return result.records.map((record) => ({
      attemptId: record.get("attemptId"),
      taskTitle: record.get("taskTitle"),
      taskDescription: record.get("taskDescription"),
      taskPoints: record.get("taskPoints"),
      userName: record.get("userName"),
      userEmail: record.get("userEmail"),
      imageProofUrl: record.get("imageProofUrl"),
      attemptCreatedAt: record.get("attemptCreatedAt"),
    }));
  } finally {
    await session.close();
  }
};

export const fetchUserAttemptHistory = async (email) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (v:VoucherTask)-[c:COMPLETED_BY]->(u:User {email: $email})
      RETURN 
        elementId(c) AS attemptId,
        v.title AS taskTitle,
        v.description AS taskDescription,
        c.status AS attemptStatus,
        c.updatedAt AS updatedAt
      ORDER BY c.updatedAt DESC
      `,
      { email }
    );

    return result.records.map((record) => ({
      attemptId: record.get("attemptId"),
      taskTitle: record.get("taskTitle"),
      taskDescription: record.get("taskDescription"),
      attemptStatus: record.get("attemptStatus"),
      updatedAt: record.get("updatedAt"),
    }));
  } finally {
    await session.close();
  }
};

export const fetchPurchaseHistory = async (userEmail) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (u:User {email: $userEmail})-[r:PURCHASED]->(p:Product)
      RETURN 
        p.name AS productName, 
        r.quantity AS quantity, 
        r.createdAt AS purchaseDate, 
        p.price AS price, 
        r.fulfilled AS fulfilled
      ORDER BY r.createdAt DESC
    `, { userEmail });

    return result.records.map((record) => ({
      productName: record.get("productName"),
      quantity: record.get("quantity"),
      purchaseDate: record.get("purchaseDate"),
      totalPrice: record.get("quantity") * record.get("price"),
      fulfilled: record.get("fulfilled"), // Include the fulfilled status
    }));
  } finally {
    await session.close();
  }
};



export const fetchPreOrderHistory = async (userEmail) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (preOrder:PreOrder {userEmail: $userEmail})
      RETURN preOrder.productName AS productName, preOrder.quantity AS quantity, preOrder.totalPrice AS totalPrice, preOrder.status AS status, preOrder.createdAt AS preorderDate
      ORDER BY preOrder.createdAt DESC
    `, { userEmail });

    return result.records.map((record) => ({
      productName: record.get("productName"),
      quantity: record.get("quantity"),
      totalPrice: record.get("totalPrice"),
      status: record.get("status"),
      preorderDate: record.get("preorderDate"),
    }));
  } finally {
    await session.close();
  }
};

export const fetchAllRequests = async () => {
  const session = driver.session();
  try {
    // Fetch purchase requests
    const purchaseRequests = await session.run(`
      MATCH (u:User)-[r:PURCHASED {fulfilled: false}]->(p:Product)
      RETURN 
        u.name AS userName,
        u.email AS userEmail,
        p.name AS productName,
        r.quantity AS quantity,
        r.createdAt AS createdAt,
        'Purchase' AS requestType,
        elementId(r) AS requestId
    `);

    // Fetch preorder requests
    const preorderRequests = await session.run(`
      MATCH (preOrder:PreOrder {status: 'pending'})
      OPTIONAL MATCH (u:User {email: preOrder.userEmail})
      RETURN 
        COALESCE(u.name, 'Unknown') AS userName,
        preOrder.userEmail AS userEmail,
        preOrder.productName AS productName,
        preOrder.quantity AS quantity,
        preOrder.createdAt AS createdAt,
        'PreOrder' AS requestType,
        preOrder.status AS status,
        elementId(preOrder) AS requestId
    `);

    return {
      purchaseRequests: purchaseRequests.records.map((record) => ({
        userName: record.get("userName"),
        userEmail: record.get("userEmail"),
        productName: record.get("productName"),
        quantity: record.get("quantity"),
        createdAt: record.get("createdAt"),
        requestId: record.get("requestId"),
        status: "pending", // Default for purchase requests
      })),
      preorderRequests: preorderRequests.records.map((record) => ({
        userName: record.get("userName"),
        userEmail: record.get("userEmail"),
        productName: record.get("productName"),
        quantity: record.get("quantity"),
        createdAt: record.get("createdAt"),
        requestId: record.get("requestId"),
        status: record.get("status"),
      })),
    };
  } finally {
    await session.close();
  }
};