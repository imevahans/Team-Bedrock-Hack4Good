import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import driver from "../database/neo4j.js";
import twilio from "twilio";
import xlsx from "xlsx";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();



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

//Register User
export const registerUser = async (email, password, phoneNumber, role) => {
  const session = driver.session();
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate formatted timestamps
    const createdAt = formatTimestamp(Date.now());
    const updatedAt = createdAt;

    // Create a user node with phoneNumber
    const result = await session.run(
      `
      CREATE (u:User {
        email: $email, 
        passwordHash: $passwordHash, 
        salt: $salt, 
        phoneNumber: $phoneNumber,
        role: $role, 
        createdAt: $createdAt, 
        updatedAt: $updatedAt,
        suspended: false
      })
      RETURN u
      `,
      { email, passwordHash, salt, phoneNumber, role, createdAt, updatedAt }
    );

    // Return the created user's properties
    return result.records[0].get("u").properties;
  } finally {
    await session.close();
  }
};


// Login a user
export const loginUser = async (email, password) => {
  const session = driver.session();
  try {
    // Retrieve the passwordHash and salt for the user
    const result = await session.run(
      "MATCH (u:User {email: $email}) RETURN u.passwordHash AS passwordHash, u.salt AS salt, u.role AS role",
      { email }
    );

    if (result.records.length === 0) {
      throw new Error("User or Password incorrect.");
    }

    const { passwordHash, role } = result.records[0].toObject();

    // Verify the password by comparing it with the stored hash
    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      throw new Error("User or Password incorrect.");
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "1h" });

    return { token, role };
  } finally {
    await session.close();
  }
};

export const sendOtp = async (phoneNumber) => {
  phoneNumber = "+65" + phoneNumber; // Prefix with country code if needed

  try {
    const verification = await createVerification(phoneNumber); // Send OTP via Twilio
    console.log(`OTP sent to ${phoneNumber}:`, verification.status);
    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
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
      throw new Error("Invalid or expired OTP.");
    }

    return { success: true, message: "OTP verified successfully." };
  } catch (error) {
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
    console.log(`OTP sent to ${fullPhoneNumber}:`, verification.status);
    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
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
      throw new Error("Invalid or expired OTP.");
    }

    return { success: true, message: "OTP verified successfully." };
  } catch (error) {
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
    throw new Error("Invalid or expired OTP.");
  }

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
      RETURN u.email AS email
      `,
      { oldPhoneNumber, passwordHash, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("Failed to reset password.");
    }

    console.log("Resetting for.... ", result.records);
    console.log("Password reset successfully.");
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

export const addUser = async (email, password, phoneNumber, role) => {
  const session = driver.session();
  try {
    const salt = await bcrypt.genSalt(12); // Stronger hash
    const passwordHash = await bcrypt.hash(password, salt);
    const createdAt = formatTimestamp(Date.now());
    const updatedAt = createdAt;

    const result = await session.run(
      `
      CREATE (u:User {
        email: $email, 
        passwordHash: $passwordHash, 
        salt: $salt, 
        phoneNumber: $phoneNumber,
        role: $role, 
        createdAt: $createdAt, 
        updatedAt: $updatedAt,
        suspended: false
      })
      RETURN u
      `,
      { email, passwordHash, salt, phoneNumber, role, createdAt, updatedAt }
    );
    const user = result.records[0].get("u").properties;
    delete user.passwordHash;
    delete user.salt;
    return user;
  } finally {
    await session.close();
  }
};

export const suspendUser = async (email) => {
  const session = driver.session();
  try {
    await session.run("MATCH (u:User {email: $email}) SET u.suspended = true", { email });
  } finally {
    await session.close();
  }
};

export const unsuspendUser = async (email) => {
  const session = driver.session();
  try {
    await session.run("MATCH (u:User {email: $email}) SET u.suspended = false", { email });
  } finally {
    await session.close();
  }
};

export const resetPasswordByAdmin = async (email) => {
  const session = driver.session();
  try {
    const newPassword = Math.random().toString(36).slice(-8); // Generate a random password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updatedAt = formatTimestamp(Date.now());
    await session.run(
      "MATCH (u:User {email: $email}) SET u.passwordHash = $passwordHash, u.updatedAt = $updatedAt",
      { email, passwordHash, updatedAt }
    );
    return newPassword;
  } finally {
    await session.close();
  }
};

export const updateUser = async (email, role, phoneNumber) => {
  const session = driver.session();
  try {
    const updatedAt = formatTimestamp(Date.now());

    const result = await session.run(
      `
      MATCH (u:User {email: $email})
      SET 
        u.role = COALESCE($role, u.role),
        u.phoneNumber = COALESCE($phoneNumber, u.phoneNumber),
        u.updatedAt = $updatedAt
      RETURN u
      `,
      { email, role, phoneNumber, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("User not found.");
    }

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
export const bulkAddUsers = async (filePath) => {
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

  console.log("Message sent: %s", info.messageId);
};

// Accept invitation and set password
export const acceptInvitation = async (email, password) => {
  const session = driver.session();

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const updatedAt = formatTimestamp(Date.now());

    const result = await session.run(
      `
      MATCH (u:User {email: $email, invitationAccepted: false})
      SET u.passwordHash = $passwordHash, u.invitationAccepted = true, u.updatedAt = $updatedAt
      RETURN u
      `,
      { email, passwordHash, updatedAt }
    );

    if (result.records.length === 0) {
      throw new Error("Invalid invitation or user already accepted.");
    }
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
      "MATCH (u:User {email: $email}) RETURN u.name AS name",
      { email }
    );

    if (result.records.length === 0) {
      return null; // User not found
    }

    return { name: result.records[0].get("name") };
  } finally {
    await session.close();
  }
};

export const addUserManually = async (email, phoneNumber, name) => {
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
        role: "resident",
        invitationAccepted: false,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN u
      `,
      { email, phoneNumber, name, createdAt, updatedAt }
    );
    const user = result.records[0].get("u").properties;
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
