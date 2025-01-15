import React, { useState } from "react";
import api from "../services/api";

const TestPage = () => {
  const [message, setMessage] = useState("");

  const handleTestRequest = async () => {
    try {
      const response = await api.post("/auth/testpage");
      setMessage(response.data.message || "Request was successful!");
    } catch (error) {
      setMessage(error.response?.data?.error || "An error occurred.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Page</h1>
      <button onClick={handleTestRequest} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Send Test Request
      </button>
      {message && (
        <p style={{ marginTop: "20px", color: "green" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default TestPage;
