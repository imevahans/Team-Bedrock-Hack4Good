import React, { createContext, useState, useContext } from "react";

// Create the Notification Context
const NotificationContext = createContext();

// Notification Provider component to wrap around the app
export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState(""); // 'success' or 'error'

  const showNotification = (message, type) => {
    setMessage(message);
    setType(type);
  };

  return (
    <NotificationContext.Provider value={{ message, type, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  return useContext(NotificationContext);
};
