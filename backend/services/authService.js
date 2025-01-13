import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import driver from "../database/neo4j.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Register a user
export const registerUser = async (email, password, role) => {
  const session = driver.session();
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    const passwordHash = await bcrypt.hash(password, salt);

    // Create a user node with the salt stored
    const result = await session.run(
      `
      CREATE (u:User {
        email: $email, 
        passwordHash: $passwordHash, 
        salt: $salt, 
        role: $role, 
        createdAt: timestamp(), 
        updatedAt: timestamp()
      })
      RETURN u
      `,
      { email, passwordHash, salt, role }
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
      throw new Error("User not found");
    }

    const { passwordHash, role } = result.records[0].toObject();

    // Verify the password by comparing it with the stored hash
    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      throw new Error("Invalid password");
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "1h" });

    return { token, role };
  } finally {
    await session.close();
  }
};
