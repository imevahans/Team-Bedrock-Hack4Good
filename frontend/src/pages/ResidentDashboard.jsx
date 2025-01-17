import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/ResidentDashboard.css";
import profile from "../assets/profile.png";
import logout from "../assets/logout.png";
import minimart from "../assets/minimart.png";
import food from "../assets/food.png";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook

const ResidentDashboard = () => {
  const { user } = useAuth(); // Access the user's details
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [userName, setUserName] = useState([]);
  const [userBalance, setUserBalance] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [searchTermProduct, setSearchTermProduct] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [sortCriteria, setSortCriteria] = useState("name"); // "name", "price", or "quantity"
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [preOrderQuantity, setPreOrderQuantity] = useState(1);
  const [selectedPreOrderProduct, setSelectedPreOrderProduct] = useState(null);
  const [preOrderTotalPrice, setPreOrderTotalPrice] = useState(0);
  const [voucherTasks, setVoucherTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [searchTermVoucher, setSearchTermVoucher] = useState("");
  const [sortCriteriaVoucher, setSortCriteriaVoucher] = useState("title"); // Default: "title"
  const [sortOrderVoucher, setSortOrderVoucher] = useState("asc"); // Default: "asc"
  const [filterStatus, setFilterStatus] = useState("all"); // Default: "all"
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [preOrderHistory, setPreOrderHistory] = useState([]);
  const [searchTermPurchase, setSearchTermPurchase] = useState("");
  const [sortOrderPurchase, setSortOrderPurchase] = useState("desc"); // "asc" or "desc"
  const [sortCriteriaPurchase, setSortCriteriaPurchase] = useState("purchaseDate"); // Default: "purchaseDate"
  const [searchTermPreorder, setSearchTermPreorder] = useState("");
  const [sortOrderPreorder, setSortOrderPreorder] = useState("desc"); // "asc" or "desc"
  const [sortCriteriaPreorder, setSortCriteriaPreorder] = useState("preorderDate"); // Default: "purchaseDate"
  const [filterStatusPreorder, setFilterStatusPreorder] = useState("all"); // "all", "pending", "approved", "rejected"
  const [filterStatusPurchase, setFilterStatusPurchase] = useState("all"); // "all", "fulfilled", "pending"
  const [auctions, setAuctions] = useState([]);
  const [userBid, setUserBid] = useState({});
  const [wonAuctions, setWonAuctions] = useState([]);




  useEffect(() => {
    if (activeTab === "Products") {
      fetchProducts();
    } else if (activeTab === "Voucher Tasks") {
      fetchVoucherTasks();
      fetchAttemptHistory();
    } else if (activeTab === "Transaction History") {
      fetchTransactionHistory();
    } else if(activeTab === "Dashboard") {
      fetchVoucherTasks();
      fetchAttemptHistory();
    } else if (activeTab === 'Auction') {
      fetchAuctions();
      fetchWonAuctions();
    }
    fetchUserDetails(); // Fetch both user name and balance
  }, [activeTab]); // Re-fetch products, vouchers, and user details when active tab changes
  
  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auth/auctions');
      setAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error.message);
    }
  };
  
  const fetchWonAuctions = async () => {
    try {
      const response = await api.get(`/auth/auctions/won?email=${user.email}`);
      setWonAuctions(response.data);
    } catch (error) {
      console.error('Error fetching won auctions:', error.message);
    }
  };
  
  const fetchTransactionHistory = async () => {
    try {
      const purchaseResponse = await api.get(`/auth/transactions/purchases?email=${user.email}`);
      setPurchaseHistory(purchaseResponse.data);
  
      const preorderResponse = await api.get(`/auth/transactions/preorders?email=${user.email}`);
      setPreOrderHistory(preorderResponse.data);
    } catch (error) {
      console.error("Error fetching transaction history:", error.message);
      showNotification("Failed to fetch transaction history.", "error");
    }
  };

  const filteredSortedPurchaseHistory = [...purchaseHistory]
  .filter(
    (purchase) =>
      purchase.productName?.toLowerCase().includes(searchTermPurchase.toLowerCase()) &&
      (filterStatusPurchase === "all" || (purchase.fulfilled ? "fulfilled" : "pending") === filterStatusPurchase.toLowerCase())
  )
  .sort((a, b) => {
    let fieldA = a[sortCriteriaPurchase];
    let fieldB = b[sortCriteriaPurchase];

    if (sortCriteriaPurchase === "purchaseDate") {
      fieldA = new Date(a.purchaseDate);
      fieldB = new Date(b.purchaseDate);
    }

    return sortOrderPurchase === "asc"
      ? fieldA > fieldB
        ? 1
        : -1
      : fieldA < fieldB
      ? 1
      : -1;
  });



  const filteredSortedPreOrderHistory = [...preOrderHistory]
  .filter(
    (preOrder) =>
      preOrder.productName?.toLowerCase().includes(searchTermPreorder.toLowerCase()) &&
      (filterStatusPreorder === "all" || preOrder.status?.toLowerCase() === filterStatusPreorder.toLowerCase())
  )
  .sort((a, b) => {
    let fieldA = a[sortCriteriaPreorder];
    let fieldB = b[sortCriteriaPreorder];

    if (sortCriteriaPreorder === "preorderDate") {
      fieldA = new Date(a.preorderDate);
      fieldB = new Date(b.preorderDate);
    }

    return sortOrderPreorder === "asc"
      ? fieldA > fieldB
        ? 1
        : -1
      : fieldA < fieldB
      ? 1
      : -1;
  });

  const handlePreOrderClick = (product) => {
    setSelectedPreOrderProduct(product);
    setPreOrderQuantity(1); // Set the initial quantity to 1
    setPreOrderTotalPrice((1 * product.price).toFixed(2)); // Calculate total price directly from product
    setShowPreOrderModal(true); // Show the pre-order modal
  };
  
  
  // Handle Pre-order modal close
  const handleClosePreOrderModal = () => {
    setShowPreOrderModal(false);
    setSelectedPreOrderProduct(null);
    setPreOrderQuantity(1);
    setPreOrderTotalPrice(0);
  };
  
  const handlePreOrderQuantityChange = (e) => {
    const newQuantity = Number(e.target.value);
    setPreOrderQuantity(newQuantity);
    if (selectedPreOrderProduct) {
      setPreOrderTotalPrice((newQuantity * selectedPreOrderProduct.price).toFixed(2));
    }
  };

  
  const handlePreOrderSubmit = async () => {
    try {
      if (!selectedPreOrderProduct) return;
  
      const totalCost = preOrderQuantity * selectedPreOrderProduct.price; // Calculate total price
  
      // Log all the data being sent to the backend for debugging
      console.log("Sending the following data to backend:");
      console.log({
        productName: selectedPreOrderProduct.name,
        quantity: preOrderQuantity,
        userEmail: user.email,
        price: selectedPreOrderProduct.price,
        userName: user.name,
        totalCost,
      });
  
      // Check if the user has enough balance
      if (userBalance < totalCost) {
        showNotification("Insufficient balance for pre-order.", "error");
        return;
      }
  
      // Send pre-order request to backend
      const response = await api.post("/auth/products/preorder", {
        productName: selectedPreOrderProduct.name,
        quantity: preOrderQuantity,
        userEmail: user.email,
        price: selectedPreOrderProduct.price, // Backend will calculate totalPrice
        userName: user.name,
      });
  
      showNotification(response.data.message, "success");
      handleClosePreOrderModal(); // Close the pre-order modal
      fetchProducts(); // Refresh the product list
      fetchUserDetails(); // Update the user balance
    } catch (error) {
      console.error("Error pre-ordering product:", error.message);
      showNotification("Failed to place pre-order.", "error");
    }
  };


  
  const fetchProducts = async () => {
    try {
      const response = await api.get("/auth/products");
      const products = response.data.products.map((product) => ({
        name: product.name,
        price: Number(product.price),
        quantity: Number(product.quantity),
        imageUrl: product.imageUrl || "../assets/minimart.png", // Use a default image if none provided
      }));
      setProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error.message);
      showNotification("Failed to fetch products.", "error");
    }
  };


  const fetchVoucherTasks = async () => {
    try {
      // Fetch tasks and attempts
      const tasksResponse = await api.get("/auth/vouchers/tasks");
      const attemptsResponse = await api.get(`/auth/vouchers/attempts?email=${user.email}`);
  
      // console.log("Tasks Response:", tasksResponse.data); // Debugging
      // console.log("Attempts Response:", attemptsResponse.data); // Debugging
  
      // Filter only active tasks
      const activeTasks = tasksResponse.data.filter(task => task.status === "active");
  
      // Combine task data with attempt counts
      const tasksWithAttempts = activeTasks.map(task => ({
        ...task,
        attempts: attemptsResponse.data[task.id] || 0,
      }));
  
      setVoucherTasks(tasksWithAttempts);
      // console.log("Tasks With Attempts:", tasksWithAttempts); // Debugging
    } catch (error) {
      console.error("Error fetching voucher tasks:", error); // Log the error for debugging
      showNotification("Failed to fetch voucher tasks.", "error");
    }
  };

  // Filter, search, and sort voucher tasks
  const filteredVoucherTasks = voucherTasks
  .filter(
    (task) =>
      task.title.toLowerCase().includes(searchTermVoucher.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTermVoucher.toLowerCase())
  )
  .sort((a, b) => {
    let fieldA = a[sortCriteriaVoucher];
    let fieldB = b[sortCriteriaVoucher];

    // Handle string comparison for title
    if (sortCriteriaVoucher === "title") {
      fieldA = fieldA.toLowerCase();
      fieldB = fieldB.toLowerCase();
    }

    return sortOrderVoucher === "asc" ? (fieldA > fieldB ? 1 : -1) : (fieldA < fieldB ? 1 : -1);
  });

  const filteredAttemptHistory = attemptHistory.filter(
    (attempt) =>
      filterStatus === "all" || attempt.attemptStatus.toLowerCase() === filterStatus.toLowerCase()
  );
  
  
  
  
  

  // Function to fetch both user details (name and balance) at once
  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/auth/user-details?email=${user.email}`);
      setUserName(response.data.name);
      setUserBalance(Number(response.data.balance).toFixed(2)); // Ensure balance has 2 decimal places
    } catch (error) {
      console.error("Error fetching user details:", error.message);
    }
  };
  

  const handleBuyProduct = async () => {
    try {
      if (!selectedProduct) return;

      const totalCost = totalPrice;
      if (userBalance < totalCost) {
        showNotification("Insufficient balance.", "error");
        return;
      }

      const response = await api.post("/auth/products/buy", {
        productName: selectedProduct.name,
        quantity: quantity,
        userEmail: user.email
      });

      showNotification(response.data.message, "success"); // Show success message
      setShowModal(false); // Close the modal
      fetchProducts(); // Refresh products list
      fetchUserDetails(); // Update the balance after the purchase
    } catch (error) {
      console.error("Error buying product:", error.message);
      showNotification(`"Error buying product: ${error.message}`, "error");
    }
  };

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setTotalPrice((product.price).toFixed(2));
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
      setTotalPrice((newQuantity * selectedProduct.price).toFixed(2));
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

  const handleSearchChange = (e) => {
    setSearchTermProduct(e.target.value);
  };

  const handleSortCriteriaChange = (e) => {
    setSortCriteria(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  // Filter and sort products
  const filteredProducts = products
  .filter((product) =>
    product.name.toLowerCase().includes(searchTermProduct.toLowerCase())
  )
  .sort((a, b) => {
    let fieldA = a[sortCriteria];
    let fieldB = b[sortCriteria];

    if (sortCriteria === "name") {
      fieldA = fieldA.toLowerCase();
      fieldB = fieldB.toLowerCase();
    }

    if (sortOrder === "asc") {
      return fieldA > fieldB ? 1 : -1;
    }
    return fieldA < fieldB ? 1 : -1;
  });

  
  const handleUploadProof = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedImage(file);
  };
  
  const handleAttemptTask = async () => {
    if (!uploadedImage || !selectedTask) {
      showNotification("Please upload proof before completing the task.", "error");
      return;
    }
  
    const formData = new FormData();
    formData.append("taskId", selectedTask.id);
    formData.append("userEmail", user.email);
    formData.append("image", uploadedImage);
    formData.append("userName", user.name);
  
    try {
      const response = await api.post("/auth/resident/vouchers/attempt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      showNotification(response.data.message, "success");
      setUploadedImage(null); // Reset uploaded image
      setSelectedTask(null); // Reset selected task
      fetchVoucherTasks(); // Refresh tasks
      fetchAttemptHistory();
    } catch (error) {
      showNotification("Failed to mark task as complete.", "error");
    }
  };

  const fetchAttemptHistory = async () => {
    try {
      const response = await api.get(`/auth/resident/vouchers/attempt-history?email=${user.email}`);
      setAttemptHistory(response.data);
    } catch (error) {
      console.error("Error fetching attempt history:", error.message);
      showNotification("Failed to fetch attempt history.", "error");
    }
  };

  const handlePlaceBid = async (auctionId) => {
    const bidAmount = parseFloat(userBid[auctionId]);
    if (!bidAmount || isNaN(bidAmount)) {
      alert('Please enter a valid bid amount.');
      return;
    }
  
    try {
      await api.post('/auth/auctions/bid', {
        auctionId,
        userEmail: user.email,
        bidAmount,
        userName: user.name,
      });
      alert('Bid placed successfully.');
      fetchAuctions();
      setUserBid({ ...userBid, [auctionId]: '' });
    } catch (error) {
      console.error('Error placing bid:', error.message);
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
          className={`sidebar-button ${activeTab === "Dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("Dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`sidebar-button ${activeTab === "Products" ? "active" : ""}`}
          onClick={() => setActiveTab("Products")}
        >
          Products
        </button>
        <button
          className={`sidebar-button ${activeTab === "Auction" ? "active" : ""}`}
          onClick={() => setActiveTab("Auction")}
        >
          Auction
        </button>
        <button
          className={`sidebar-button ${activeTab === "Voucher Tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("Voucher Tasks")}
        >
          Voucher Tasks
        </button>
        <button
          className={`sidebar-button ${activeTab === "Transaction History" ? "active" : ""}`}
          onClick={() => setActiveTab("Transaction History")}
        >
          Transaction History
        </button>
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

        {activeTab === "Dashboard" && (
          <div className="dashboard">
            <h2>Welcome, {userName}!</h2>
            <p>Your Current Balance: <strong>${userBalance}</strong></p>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Pending Voucher Task Attempts</h3>
                <p>
                  You have{" "}
                  <strong>{attemptHistory.filter((a) => a.attemptStatus === "pending").length}</strong>{" "}
                  pending voucher task attempt(s).
                </p>
                <button onClick={() => setActiveTab("Voucher Tasks")}>
                  View Voucher Tasks
                </button>
              </div>

              <div className="dashboard-card">
                <h3>Approved Voucher Task Attempts</h3>
                <p>
                  You have{" "}
                  <strong>{attemptHistory.filter((a) => a.attemptStatus === "approved").length}</strong>{" "}
                  approved voucher task attempt(s).
                </p>
                <button onClick={() => setActiveTab("Voucher Tasks")}>
                  View Voucher Tasks
                </button>
              </div>

              <div className="dashboard-card">
                <h3>Rejected Voucher Task Attempts</h3>
                <p>
                  You have{" "}
                  <strong>{attemptHistory.filter((a) => a.attemptStatus === "rejected").length}</strong>{" "}
                  rejected voucher task attempt(s).
                </p>
                <button onClick={() => setActiveTab("Voucher Tasks")}>
                  View Voucher Tasks
                </button>
              </div>

              <div className="dashboard-card">
                <h3>Shop Products</h3>
                <p>Explore and buy products with your balance.</p>
                <button onClick={() => setActiveTab("Products")}>Go to Products</button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "Auction" && (
          <div>
            <h2>Participate in Auctions</h2>
            {auctions.map((auction) => (
              <div key={auction.id}>
                <img src={auction.imageUrl} alt={auction.itemName} />
                <p><strong>{auction.itemName}</strong></p>
                <p>{auction.description}</p>
                <p>Current Bid: {auction.currentBid}</p>
                <input
                  type="number"
                  placeholder="Your Bid"
                  value={userBid[auction.id] || ''}
                  onChange={(e) => setUserBid({ ...userBid, [auction.id]: e.target.value })}
                />
                <button onClick={() => handlePlaceBid(auction.id)}>Place Bid</button>
              </div>
            ))}

            <h3>Your Won Auctions</h3>
            <table className="won-auctions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Status</th>
                <th>Winning Bid</th>
              </tr>
            </thead>
            <tbody>
              {wonAuctions.map((auction, index) => (
                <tr key={auction.id || index}>
                  <td>{index + 1}</td>
                  <td>{auction.itemName}</td>
                  {/* Apply conditional styling for the status */}
                  <td className={auction.status === "fulfilled" ? "status-fulfilled" : "status-pending"}>
                    {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)} {/* Capitalize */}
                  </td>
                  <td>${auction.winningBid}</td>
                </tr>
              ))}
            </tbody>
</table>


          </div>
        )}


        {/* Conditional Rendering for Active Tab */}
        {activeTab === "Voucher Tasks" && (
          <div>
            <h2>Available Voucher Tasks</h2>
            <div className="controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search voucher tasks..."
                  value={searchTermVoucher}
                  onChange={(e) => setSearchTermVoucher(e.target.value)}
                />
              </div>

              <div className="sort-controls">
                <select
                  value={sortCriteriaVoucher}
                  onChange={(e) => setSortCriteriaVoucher(e.target.value)}
                >
                  <option value="title">Title</option>
                  <option value="points">Points</option>
                  <option value="attempts">Number of Attempts</option>
                </select>
                <button onClick={() => setSortOrderVoucher((prev) => (prev === "asc" ? "desc" : "asc"))}>
                  Sort: {sortOrderVoucher === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>
            {filteredVoucherTasks.length === 0 ? (
              <p>No voucher tasks available.</p>
            ) : (
              filteredVoucherTasks.map((task) => {
                const remainingAttempts = task.maxAttempts - task.attempts;
                return (
                  <div key={task.id} className="voucher-task-card">
                    <p><strong>{task.title}</strong></p>
                    <p>{task.description}</p>
                    <p>Points: {task.points}</p>
                    <p>Remaining Attempts: {remainingAttempts}</p>
                    <p>Attempts Made: {task.attempts}</p> {/* Display attempts */}
                    <button
                      onClick={() => {
                        // console.log("Selected Task:", task); // Debugging
                        setSelectedTask(task);
                      }}
                      disabled={remainingAttempts <= 0}
                    >
                      Attempt Task
                    </button>
                  </div>
                );
              })
            )}

            {/* Users' Voucher Tasks History */}
            <div>
              <h2>Your Attempt History</h2>
              <div className="filter-controls">
                <label>Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Show All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {filteredAttemptHistory.length === 0 ? (
                <p>No attempts found.</p>
              ) : (
                <table className="attempt-history-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttemptHistory.map((attempt) => (
                      <tr key={attempt.attemptId}>
                        <td>{attempt.taskTitle}</td>
                        <td>{attempt.taskDescription}</td>
                        <td>
                          <span
                            className={`status-${attempt.attemptStatus.toLowerCase()}`}
                          >
                            {attempt.attemptStatus}
                          </span>
                        </td>
                        <td>{new Date(attempt.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>


            {/* Modal for Attempt Task */}
            {selectedTask && (
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
                  <h3>Attempt Task: {selectedTask.title}</h3>
                  <p>{selectedTask.description}</p>

                  {/* File Upload */}
                  <div>
                    <label>Upload Proof:</label>
                    <input type="file" onChange={handleUploadProof} accept="image/*" />
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <button onClick={handleAttemptTask} style={{ marginRight: "10px" }}>
                      Submit Proof
                    </button>
                    <button onClick={() => setSelectedTask(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Transaction History" && (
          <div>
            <h2>Your Transaction History</h2>
            
            <h3>Purchase History</h3>
            <div className="controls">
              <input
                type="text"
                placeholder="Search Purchase History..."
                value={searchTermPurchase}
                onChange={(e) => setSearchTermPurchase(e.target.value)}
                className="search-bar"
              />
              <select
                value={sortCriteriaPurchase}
                onChange={(e) => setSortCriteriaPurchase(e.target.value)}
                className="sort-criteria"
              >
                <option value="productName">Product Name</option>
                <option value="quantity">Quantity</option>
                <option value="totalPrice">Total Price</option>
                <option value="purchaseDate">Date</option>
              </select>
              <select
                value={filterStatusPurchase}
                onChange={(e) => setFilterStatusPurchase(e.target.value)}
                className="status-filter"
              >
                <option value="all">All</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="pending">Pending</option>
              </select>
              <button onClick={() => setSortOrderPurchase((prev) => (prev === "asc" ? "desc" : "asc"))}>
                Sort: {sortOrderPurchase === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>

            {filteredSortedPurchaseHistory.length > 0 ? (
              <table className="transaction-history-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedPurchaseHistory.map((purchase, index) => (
                    <tr key={index}>
                      <td>{purchase.productName}</td>
                      <td>{purchase.quantity}</td>
                      <td>${purchase.totalPrice ? purchase.totalPrice.toFixed(2) : "N/A"}</td>
                      <td className={`status-${purchase.fulfilled ? "fulfilled" : "pending"}`}>
                        {purchase.fulfilled ? "Fulfilled" : "Pending"}
                      </td>
                      <td>{new Date(purchase.purchaseDate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No purchases found.</p>
            )}



            <h3>Preorder History</h3>
            <div className="controls">
              <input
                type="text"
                placeholder="Search Preorder History..."
                value={searchTermPreorder}
                onChange={(e) => setSearchTermPreorder(e.target.value)}
                className="search-bar"
              />
              <select
                value={sortCriteriaPreorder}
                onChange={(e) => setSortCriteriaPreorder(e.target.value)}
                className="sort-criteria"
              >
                <option value="productName">Product Name</option>
                <option value="quantity">Quantity</option>
                <option value="totalPrice">Total Price</option>
                <option value="preorderDate">Date</option>
              </select>
              <select
                value={filterStatusPreorder}
                onChange={(e) => setFilterStatusPreorder(e.target.value)}
                className="status-filter"
              >
                <option value="all">All</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <button onClick={() => setSortOrderPreorder((prev) => (prev === "asc" ? "desc" : "asc"))}>
                Sort: {sortOrderPreorder === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>


            {filteredSortedPreOrderHistory.length > 0 ? (
              <table className="transaction-history-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedPreOrderHistory.map((preOrder, index) => (
                    <tr key={index}>
                      <td>{preOrder.productName}</td>
                      <td>{preOrder.quantity}</td>
                      <td>${preOrder.totalPrice ? preOrder.totalPrice.toFixed(2) : "N/A"}</td>
                      <td className={`status-${preOrder.status.toLowerCase()}`}>{preOrder.status}</td>
                      <td>{new Date(preOrder.preorderDate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            ) : (
              <p>No preorders found.</p>
            )}


          </div>
        )}


        {activeTab === "Products" && (
          <section className="rounded-section">
            <h2>Available Products</h2>
            <div className="product-controls">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTermProduct}
                onChange={handleSearchChange}
                className="search-bar"
              />
              <div className="sort-controls">
                <select value={sortCriteria} onChange={handleSortCriteriaChange} className="sort-criteria">
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="quantity">Quantity</option>
                </select>
                <button onClick={toggleSortOrder} className="sort-button">
                  Sort: {sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <div className="product-card" key={product.name}>
                    <div className="product-image">
                      <img src={product.imageUrl} alt={product.name} />
                    </div>
                    <p><strong>Name:</strong> {product.name}</p>
                    <p><strong>Price:</strong> ${product.price}</p>
                    <p><strong>Quantity:</strong> {product.quantity}</p>
                    <div className="product-actions">
                      {product.quantity === 0 ? (
                        <p style={{ color: "red" }}>Out of Stock</p>
                      ) : (
                        <button onClick={() => handleOpenModal(product)}>Buy</button>
                      )}
                      {product.quantity === 0 && <button onClick={() => handlePreOrderClick(product)}>Pre Order</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No products available.</p>
            )}
          </section>
        )}
      </div>

      {/* Pre-order Modal */ }
      {showPreOrderModal && selectedPreOrderProduct && (
        <div className="modal" style={{ position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", background: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: "1000" }}>
          <div className="modal-content" style={{ background: "#fff", padding: "20px", borderRadius: "10px", width: "400px", textAlign: "center" }}>
            <h4>{selectedPreOrderProduct.name}</h4>
            <p><strong>Total Price: </strong>${preOrderTotalPrice}</p>
            <label>
              Quantity:
              <input
                type="number"
                value={preOrderQuantity}
                min="1"
                onChange={handlePreOrderQuantityChange}
                style={{ width: "100px", padding: "5px" }}
              />
            </label>
            <div>
              <button onClick={handlePreOrderSubmit}>Confirm Pre-order</button>
              <button onClick={handleClosePreOrderModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}


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
