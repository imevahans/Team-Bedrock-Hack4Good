import React, { createContext, useState } from "react";

// Create AuthContext
export const AuthContext = createContext();

// Provide AuthContext
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  console.log("AuthProvider rendered, user:", user); // Debug log

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
