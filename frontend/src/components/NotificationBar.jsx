import React, { useState, useEffect } from "react";

const NotificationBar = ({ message, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true); // Show the notification when a message is provided

      // Hide the notification after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer); // Cleanup the timer on component unmount or message change
    }
  }, [message]);

  if (!visible) {
    return null; // If not visible, don't render the notification
  }

  return (
    <div
      style={{
        backgroundColor: type === "success" ? "#4CAF50" : "#F44336", // Green for success, Red for error
        color: "white",
        padding: "15px",
        textAlign: "center",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        fontSize: "16px", // Adjust font size for better visibility
        fontWeight: "bold", // Optional: Makes the text stand out
      }}
    >
      {message}
    </div>
  );
};

export default NotificationBar;
