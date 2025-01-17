import React, { useState, useEffect } from "react";

const NotificationBar = ({ message, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);

      // Hide the notification after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [message]);

  if (!visible) return null;

  return (
    <div
      style={{
        backgroundColor:
          type === "success"
            ? "#4CAF50"
            : type === "error"
            ? "#F44336"
            : "#2196F3", // Default to blue for info
        color: "white",
        padding: "15px 20px",
        textAlign: "center",
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)", // Center horizontally
        zIndex: 1000,
        fontSize: "16px",
        fontWeight: "bold",
        borderRadius: "8px", // Rounded corners
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow
        maxWidth: "90%",
        width: "400px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease-in-out", // Smooth fade-in/out effect
      }}
    >
      {message}
    </div>
  );
};

export default NotificationBar;
