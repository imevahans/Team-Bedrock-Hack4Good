import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ResidentDashboard.css";
import profile from "../assets/profile.png";
import logout from "../assets/logout.png";
import minimart from "../assets/minimart.png";
import food from "../assets/food.png";
import { useNotification } from "../context/NotificationContext";

const ResidentDashboard = () => {
  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [userName, setUserName] = useState([]);
  const [userBalance, setUserBalance] = useState([]);
    const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    if (activeTab === "Products") {
      fetchProducts();
    } else if (activeTab === "Vouchers") {
      fetchVouchers();
    }
    fetchUserDetails(); // Fetch both user name and balance
  }, [activeTab]); // Re-fetch products, vouchers, and user details when active tab changes

  const fetchProducts = async () => {
    try {
      const response = await api.get("/auth/products");
      const products = response.data.products.map((product) => ({
        name: product.name,
        price: Number(product.price),
        quantity: Number(product.quantity),
      }));
      setProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error.message);
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await api.get("/resident/vouchers");
      setVouchers(response.data);
    } catch (error) {
      console.error("Error fetching vouchers:", error.message);
    }
  };

  // Function to fetch both user details (name and balance) at once
  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/auth/user-details?email=${userEmail}`);
      setUserName(response.data.name); // Set the user's name
      setUserBalance(response.data.balance); // Set the user's balance
    } catch (error) {
      console.error("Error fetching user details:", error.message);
    }
  };

  const handleBuyProduct = async () => {
    try {
      if (!selectedProduct) return;
      console.log(userBalance);

      const totalCost = totalPrice;
      if (userBalance < totalCost) {
        alert("Insufficient balance.");
        return;
      }

      const response = await api.post("/auth/products/buy", {
        productName: selectedProduct.name,
        quantity: quantity,
      });

      alert(response.data.message); // Show success message
      setShowModal(false); // Close the modal
      fetchProducts(); // Refresh products list
      fetchUserDetails(); // Update the balance after the purchase
    } catch (error) {
      console.error("Error buying product:", error.message);
    }
  };

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setTotalPrice(product.price);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setTotalPrice(0);
  };

  const handleQuantityChange = (e) => {
    const newQuantity = Number(e.target.value);
    setQuantity(newQuantity);
    if (selectedProduct) {
      setTotalPrice(newQuantity * selectedProduct.price);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail"); // Remove email from local storage
      window.location.href = "/"; // Redirect to the login page or home page
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile-section">
          <button style={{ marginBottom: "10px" }}>
            <img src={profile} className="profile-image" />
          </button>
          {/* Display User Name below profile */}
          <p style={{ textAlign: "center", fontWeight: "bold", color: "white" }}>
            {userName || "User"} {/* Display the user's name */}
          </p>
        </div>
        <div className="balance-container">
          <p>Your Balance: ${userBalance}</p> {/* Display user balance */}
        </div>
        <button
          className={`sidebar-button ${activeTab === "Products" ? "active" : ""}`}
          onClick={() => setActiveTab("Products")}
        >
          Products
        </button>
        <button
          className={`sidebar-button ${activeTab === "Vouchers" ? "active" : ""}`}
          onClick={() => setActiveTab("Vouchers")}
        >
          Vouchers
        </button>
        <button className="sidebar-button">Nav Bar Item 3</button>
        <button className="sidebar-button">Nav Bar Item 4</button>
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            Log Out
            <img src={logout} className="logout-image" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header-container">
          <h1>
            <img src={minimart} className="dashboard-image" />
            Muhammadiyah MiniMart
            <img src={food} className="dashboard-image" />
          </h1>
        </div>

        {/* Conditional Rendering for Active Tab */}
        {activeTab === "Vouchers" && (
          <section className="rounded-section">
            <h2>Your Vouchers</h2>
            <ul>
              {vouchers.length === 0 ? (
                <li>No vouchers available</li>
              ) : (
                vouchers.map((voucher) => (
                  <li key={voucher.id}>
                    Voucher ID: {voucher.id}, Balance: {voucher.balance} points
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {activeTab === "Products" && (
          <section className="rounded-section">
            <h2>Available Products</h2>
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.name}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    marginBottom: "10px",
                    borderRadius: "5px",
                  }}
                >
                  <p>
                    <strong>Name:</strong> {product.name}
                  </p>
                  <p>
                    <strong>Price:</strong> ${product.price}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {product.quantity}
                  </p>
                  <button onClick={() => handleOpenModal(product)}>Buy</button>
                </div>
              ))
            ) : (
              <p>No products available.</p>
            )}
          </section>
        )}
      </div>

      {/* Modal for buying a product */}
      {showModal && selectedProduct && (
        <div
          className="modal"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "1000",
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              textAlign: "center",
            }}
          >
            <h4>{selectedProduct.name}</h4>
            <p>
              <strong>Total Price: </strong>${totalPrice}
            </p>
            <label>
              Quantity:
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={handleQuantityChange}
                style={{ width: "100px", padding: "5px" }}
              />
            </label>
            <div>
              <button onClick={handleBuyProduct}>Confirm</button>
              <button onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
