import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import jwt from "jsonwebtoken";
import driver from "../database/neo4j.js";

// Environment Variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// Format timestamp in GMT+8
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const gmt8Offset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const gmt8Date = new Date(date.getTime() + gmt8Offset);
  return gmt8Date.toISOString().replace("T", " ").split(".")[0]; // Format: YYYY-MM-DD HH:mm:ss
};

// Google Passport Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const session = driver.session();
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Check if user exists
        const result = await session.run(
          "MATCH (u:User {email: $email}) RETURN u",
          { email }
        );

        let role = "resident"; // Default role for new users
        if (result.records.length === 0) {
          // If user doesn't exist, create a new user
          const createdAt = formatTimestamp(Date.now());
          const updatedAt = createdAt;

          await session.run(
            `
            CREATE (u:User {
              email: $email,
              googleId: $googleId,
              role: $role,
              createdAt: $createdAt,
              updatedAt: $updatedAt
            })
            RETURN u
            `,
            { email, googleId, role, createdAt, updatedAt }
          );
        } else {
          // If user exists, retrieve their role
          role = result.records[0].get("u").properties.role || role;
        }

        // Generate JWT token
        const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "1h" });

        // Pass user info and token to the session
        done(null, { email, role, token });
      } catch (error) {
        console.error("Error during Google login:", error);
        done(error, null);
      } finally {
        await session.close();
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
