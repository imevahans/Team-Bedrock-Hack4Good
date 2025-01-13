import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
      setUser({ email: payload.email, role: payload.role });
    }
  }, []);

  const login = (token) => {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    setUser({ email: payload.email, role: payload.role });
    localStorage.setItem("token", token); // Save token in localStorage
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token"); // Remove token from localStorage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
