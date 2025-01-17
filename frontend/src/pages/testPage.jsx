import React, { useState } from "react";
import api from "../services/api";
import "../styles/testPage.css";
import minimart from "../assets/minimart.png";
import food from "../assets/food.png";

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
    <div className="test-page">
      {/* Header Section */}
      <div className="header-container">
        <h1 className="main-title">
          <img src={minimart} className="dashboard-image" alt="MiniMart" />
          Muhammadiyah Minimart
          <img src={food} className="dashboard-image" alt="Food Icon" />
        </h1>
        <p className="subtitle">
          Your one-stop shop for fresh produce, groceries, and exclusive deals!
        </p>
      </div>

      {/* Main Content */}
      <div className="content-container">
        <h1 className="page-title">Create Admin Account</h1>
        <button onClick={handleTestRequest} className="test-button">
          Create Admin Account
        </button>
        {message && <p className="response-message">{message}</p>}
      </div>
    </div>
  );
};

export default TestPage;
