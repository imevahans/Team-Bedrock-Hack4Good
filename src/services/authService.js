import neo4j from "./neo4j";

export const loginResident = async (email, password) => {
  const session = neo4j.session();
  try {
    const result = await session.run(
      "MATCH (r:Resident {email: $email, password: $password}) RETURN r",
      { email, password }
    );
    if (result.records.length === 0) {
      throw new Error("Authentication failed.");
    }
    return result.records[0].get("r").properties; // Return resident properties
  } finally {
    await session.close();
  }
};


export const sendPasswordReset = async (email) => {
    const session = neo4j.session();
    try {
      const result = await session.run(
        "MATCH (r:Resident {email: $email}) RETURN r",
        { email }
      );
      if (result.records.length === 0) {
        throw new Error("Email not found.");
      }
      // Logic to send an email via an external service (e.g., SendGrid or Twilio)
    } finally {
      await session.close();
    }
  };

  export const getUsers = async () => {
    const session = neo4j.session();
    try {
      const result = await session.run("MATCH (u:User) RETURN u");
      return result.records.map((record) => record.get("u").properties);
    } finally {
      await session.close();
    }
  };

  
export const suspendUser = async (userId) => {
const session = neo4j.session();
try {
    await session.run(
    "MATCH (u:User {id: $userId}) SET u.suspended = true",
    { userId }
    );
} finally {
    await session.close();
}
};
  

export const resetPassword = async (userId) => {
const session = neo4j.session();
try {
    const newPassword = "temporary123"; // Generate a random password here
    await session.run(
    "MATCH (u:User {id: $userId}) SET u.password = $password",
    { userId, password: newPassword }
    );
} finally {
    await session.close();
}
};
  