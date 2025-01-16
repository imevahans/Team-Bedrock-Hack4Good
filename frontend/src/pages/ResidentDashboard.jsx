import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import api from "../services/api";
import '../styles/ResidentDashboard.css'; // Import the CSS for the sidebar styles
import profile from "../assets/profile.png";
import logout from "../assets/logout.png"; 
import minimart from "../assets/minimart.png";
import food from "../assets/food.png";
import { useNotification } from "../context/NotificationContext";

const ResidentDashboard = () => {
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const { showNotification } = useNotification();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch resident vouchers
        const voucherResponse = await api.get("/resident/vouchers");
        setVouchers(voucherResponse.data);

        // Fetch available products
        const productResponse = await api.get("/products");
        setProducts(productResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      // Send a request to the backend to handle logout
      await api.get("/auth/logout");
      localStorage.removeItem("token"); // Clear the authentication token
      window.location.href = "/"; // Redirect to the login page or home page
    } catch (error) {
      console.error("Error during logout:", error.message);
      setMessage("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar - 1 column */}
        <div className="col-md-1 sidebar">
          <div className="profile-section">
            <button style={{ marginBottom: '10px' }}>
              <img src={profile} className="profile-image" />
            </button>
          </div>
          <button className="sidebar-button">Products</button>
          <button className="sidebar-button">Nav Bar Item 2</button>
          <button className="sidebar-button">Nav Bar Item 3</button>
          <button className="sidebar-button">Nav Bar Item 4</button>
          <div className="logout-container">
            <button className="logout-button" onClick={handleLogout}>
              Log Out
              <img src={logout} className="logout-image" />
            </button>
          </div>
        </div>

        {/* Main Content - 11 columns */}
        <div className="col-md-11 main-content">
          <div className="header-container">
            <h1>
              <img src={minimart} className="dashboard-image" />
              Muhammadiyah MiniMart
              <img src={food} className="dashboard-image" />
            </h1>
          </div>

          {/* Display Voucher Information */}
          <section className="rounded-section">
            <h2>Your Vouchers</h2>
            <ul>
              <li>Vouch 1 placeholder</li>
              <li>Vouch 2 placeholder</li>
              {vouchers.map((voucher) => (
                <li key={voucher.id}>
                  Voucher ID: {voucher.id}, Balance: {voucher.balance} points
                </li>
              ))}
            </ul>
          </section>

          {/* Display Available Products */}
          <section className="rounded-section">
            <h2>Available Products</h2>
            <ul>
            <li>Product 1 placeholder</li>
            <li>Product 2 placeholder</li>
              {products.map((product) => (
                <li key={product.id}>
                  {product.name} - {product.price} points
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
