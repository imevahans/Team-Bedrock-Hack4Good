import React, { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) { // Only decode the token if user is not already set
      try {
        const payload = decodeJwt(token);
        console.log("AuthContext: Initializing user from token:", payload);
        setUser({
          email: payload.email,
          role: payload.role,
          name: payload.name, // Add name to user context
        });
      } catch (error) {
        console.error("AuthContext: Invalid token", error);
        localStorage.removeItem("token");
      }
    }
  }, [user]); // Only run when user changes

  const login = (token) => {
    try {
      const payload = decodeJwt(token);
      console.log("AuthContext: Setting user:", payload);
      setUser({
        email: payload.email,
        role: payload.role,
        name: payload.name, // Store name from token
      });
      localStorage.setItem("token", token);
    } catch (error) {
      console.error("AuthContext: Failed to decode token during login", error);
    }
  };

  const logout = () => {
    console.log("AuthContext: Logging out...");
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Invalid JWT", error);
    return null;
  }
};
