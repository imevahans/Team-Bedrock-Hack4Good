import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        console.log("AuthContext: Initializing user from token:", payload);
        setUser({ email: payload.email, role: payload.role });
      } catch (error) {
        console.error("AuthContext: Invalid token", error);
      }
    }
  }, []);

  const login = (token) => {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    console.log("AuthContext: Setting user:", payload);
    setUser({ email: payload.email, role: payload.role });
    localStorage.setItem("token", token); // Save token in localStorage
  };

  const logout = () => {
    console.log("AuthContext: Logging out...");
    setUser(null);
    localStorage.removeItem("token"); // Remove token from localStorage
  };

  console.log("AuthContext: Current user:", user);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
