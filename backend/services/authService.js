import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import driver from "../database/neo4j.js";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken);

const JWT_SECRET = process.env.JWT_SECRET;

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
