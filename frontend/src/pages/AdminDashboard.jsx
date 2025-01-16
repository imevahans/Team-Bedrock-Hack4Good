import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/AdminDashboard.css"; // Use the same style file
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterInvitation, setFilterInvitation] = useState("all");
  const [dashboardStats, setDashboardStats] = useState({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("resident");
  const [editedUser, setEditedUser] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(""); // Action for confirmation popup
  const [bulkFile, setBulkFile] = useState(null); // File for bulk upload
  const [failedEntries, setFailedEntries] = useState([]); // Track failed entries
  const { user } = useAuth(); // Access the admin's details
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all"); // Action filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { showNotification } = useNotification();
  const [actions, setActions] = useState([]);
  const [products, setProducts] = useState([]);
  const [editedProduct, setEditedProduct] = useState(null); // For the product being edited
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, quantity: 0, imageFile: null });
  const [showModal, setShowModal] = useState(false); // For creating product modal
  const [showErrorModal, setShowErrorModal] = useState(false); // For error modal

  useEffect(() => {
    if (activeTab === "Dashboard") {
      fetchDashboardStats();
    } else if (activeTab === "Users") {
      fetchUsers();
    } else if (activeTab === "Products") {
      fetchProducts();
    }
  
  }, [activeTab]);

  useEffect(() => {
    fetchAuditLogs();
  }, [searchTerm, filterRole, filterAction]); // Fetch logs whenever filters change

  // Fetch available actions when component mounts
  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await api.get("/auth/audit-actions");
        setActions(response.data.actions);
      } catch (error) {
        console.error("Error fetching actions:", error.response?.data?.error || error.message);
      }
    };

    fetchActions();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/auth/dashboard-stats");
      setDashboardStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error.response?.data || error.message);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterRole = (e) => setFilterRole(e.target.value);
  const handleFilterInvitation = (e) => setFilterInvitation(e.target.value);


  const resetTimeToMidnight = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    return d;
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get("/auth/audit-logs");
      setAuditLogs(response.data.logs);
    } catch (error) {
      showNotification("Error fetching audit logs", "error");
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const searchTermLower = searchTerm.toLowerCase();
  
    // Name filter
    let nameMatch = false;
    if (log.userName != null) {
       nameMatch = log.userName.toLowerCase().includes(searchTermLower);
    }
  
    // Email filter
    let emailMatch = false;
    if (log.userEmail != null) {
      emailMatch = log.userEmail.toLowerCase().includes(searchTermLower);
    }
  
    // Details filter
    let detailMatch = false;
    if (log.details != null) {
      detailMatch = log.details.toLowerCase().includes(searchTermLower);
    }
  
    // Date filter (for matching date range)
    const dateMatch = !startDate || !endDate || (resetTimeToMidnight(new Date(log.timestamp))) >= (resetTimeToMidnight(new Date(startDate))) && (resetTimeToMidnight(new Date(log.timestamp)) <= (resetTimeToMidnight(new Date(endDate))));
  
    // Action filter
    const actionFilterMatch =
      filterAction === "all" || (log.action && log.action.toLowerCase() === filterAction.toLowerCase());
  
    // Combine all the filters
    return (
      (nameMatch || emailMatch || detailMatch) &&
      dateMatch &&
      actionFilterMatch
    );
  });
  

  // Filter and Search Users
  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();

    // Role filter
    const roleMatch =
      filterRole === "all" || user.role.toLowerCase() === filterRole.toLowerCase();

    // Invitation filter
    const invitationMatch =
      filterInvitation === "all" ||
      (filterInvitation === "sent" && user.invitationAccepted) ||
      (filterInvitation === "not-sent" && !user.invitationAccepted);

    // Search term filter
    const searchMatch =
      user.name?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower);

    return roleMatch && invitationMatch && searchMatch;
  });

  // Add new user manually
  const handleAddUserManually = async () => {
    if (!name || !email || !phoneNumber || !role) {
      showNotification("All fields are required.", "error");
      return;
    }
  
    try {
      const response = await api.post("/auth/add-user-manual", { email, phoneNumber, name, role, adminName: user.name, adminEmail: user.email });
      showNotification(response.data.message, "success");
      setUsers((prev) => [...prev, response.data.user]); // Update the user list
    } catch (error) {
      console.error("Error adding user manually:", error.response?.data || error.message);
      showNotification(error.response?.data?.error || "Failed to add user manually.", "error");
    }
  };
  

  // Suspend user
  const handleSuspendUser = async (email) => {
    console.log("user.name = ", user.name);
    console.log("user.email = ", user.email);
    try {
      const response = await api.post("/auth/suspend-user", { email, adminName: user.name, adminEmail: user.email });
      showNotification(response.data.message, "success");
      setUsers((prev) =>
        prev.map((user) => (user.email === email ? { ...user, suspended: true } : user))
      );
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to suspend user.", "error");
    }
  };

  // Unsuspend user
  const handleUnsuspendUser = async (email) => {
    try {
      const response = await api.post("/auth/unsuspend-user", { email, adminName: user.name, adminEmail: user.email });
      showNotification(response.data.message, "success");
      setUsers((prev) =>
        prev.map((user) => (user.email === email ? { ...user, suspended: false } : user))
      );
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to unsuspend user.", "error");
    }
  };
  
// Reset password by admin
const handleResetPassword = async (email, name) => {
  try {
    const response = await api.post("/auth/reset-password-admin", { email, name, adminName: user.name, adminEmail: user.email});
    showNotification(response.data.message, "success");
  } catch (error) {
    showNotification(error.response?.data?.error || "Failed to send reset password email.", "error");
  }
};

  // Save changes
  const handleSaveChanges = async () => {
    if (!editedUser?.email) return;

    try {
      const payload = {
        email: editedUser.email,
        name: editedUser.name, // Include the edited name
        role: editedUser.role || null,
        phoneNumber: editedUser.phoneNumber || null,
        confirmation: "yes",
        adminName: user.name, // Admin details for audit logging
        adminEmail: user.email
      };

      const response = await api.post("/auth/update-user", payload);
      showNotification(response.data.message, "success");
      setUsers((prev) =>
        prev.map((user) =>
          user.email === editedUser.email
            ? { ...user, name: editedUser.name, role: editedUser.role, phoneNumber: editedUser.phoneNumber }
            : user
        )
      );
      setConfirmPopup(false);
      setEditedUser(null);
    } catch (error) {
      showNotification(error.response?.data?.error || "Failed to save changes.", "error");
    }
  };


  // Handle confirmation
  const handleConfirm = () => {
    console.log("editedUser = ", editedUser);
    if (popupAction === "suspend") {
      handleSuspendUser(editedUser.email);
    } else if (popupAction === "unsuspend") {
      handleUnsuspendUser(editedUser.email);
    } else if (popupAction === "save") {
      handleSaveChanges();
    }
    setConfirmPopup(false);
    setEditedUser(null);
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    window.open("/api/auth/download-template", "_blank");
    showNotification("Downloading template!", "success");
  };

  // Bulk upload users
  const handleBulkUpload = async () => {
    if (!bulkFile) {
      showNotification("Please upload a valid Excel file.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("adminName", user.name);
    formData.append("adminEmail", user.email);
    console.log("formData = ", formData);

    // Debugging: Log FormData content
    console.log("Bulk file to upload:", bulkFile);
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await api.post("/auth/bulk-add-users", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification(response.data.message, "success");
      setUsers((prev) => [...prev, ...response.data.users]);
      setFailedEntries(response.data.failedEntries); // Store failed entries
    } catch (error) {
      console.error("Error during bulk upload:", error);
      showNotification(error.response?.data?.error || "Failed to upload users.", "error");
    }
  };

  // Handle searching/filtering
  const handleAuditSearch = () => {
    fetchAuditLogs(); // Re-fetch based on new search/filter criteria
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/auth/products"); // Make sure this route matches your Express route
  
      // Map the result to return a list of products, ensuring that price and quantity are numbers
      const products = response.data.products.map((product) => ({
        name: product.name,
        price: Number(product.price), // Safely convert to number
        quantity: Number(product.quantity), // Safely convert to number
      }));
  
      setProducts(products); // Store the products in the state
    } catch (error) {
      console.error("Error fetching products:", error.message);
      setMessage("Failed to fetch products.");
    }
  };

  const handleDeleteProduct = async (productName) => {
    try {
      const response = await api.delete("/auth/products/delete", {
        data: { productName },
      });
      showNotification(response.data.message || "Product deleted successfully.", "success");
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error("Error deleting product:", error.message);
      showNotification(`Failed to delete product due to ${error.message}.`, "error");
    }
  };

  const handleAddProduct = async () => {
    const { name, price, quantity, imageFile } = newProduct;

    console.log("imageFile = ", imageFile);
  
    // Validate the fields before sending the request
    if (!name || !price || !quantity || !imageFile) {
      setShowModal(false); // Close the modal
      setShowErrorModal(true); // Show error modal
      showNotification("All fields are required, including product image.", "error");
      return;
    }
  
    // Check if the product name already exists
    const productExists = products.some((product) => product.name.toLowerCase() === name.toLowerCase());
    if (productExists) {
      setShowModal(false); // Close the modal
      setShowErrorModal(true); // Show error modal
      showNotification("Product name already exists.", "error");
      return;
    }
  
    // Create form data to send image along with other product details
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("quantity", quantity);
    formData.append("image", imageFile); // Add image file here
  
    try {
      const response = await api.post("/auth/products/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }, // Specify multipart/form-data
      });
      showNotification(response.data.message || "Product created successfully!", "success");
      fetchProducts(); // Refresh the product list
      setShowModal(false); // Close the modal
    } catch (error) {
      console.error("Error creating product:", error.message);
      showNotification(`Failed to create product due to ${error.message}.`, "error");
      setShowErrorModal(true); // Show error modal if creation fails
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({
      ...editedProduct,
      [name]: value
    });
  };

const handleEditProduct = (product) => {
  setEditedProduct({
    ...product, // Populate the product details
    imageUrl: product.imageUrl || "", // Make sure image URL is passed
  });
};


  const handleSaveProduct = async () => {
    if (!editedProduct) return;
  
    const { name, quantity, price, originalName, currentPrice, currentQuantity } = editedProduct;
  
    try {  
      // Check if the quantity is different from the original quantity (stored in invisible field)
      if (quantity !== currentQuantity) {
        const response = await api.post("/auth/products/edit-quantity", {
          productName: originalName,
          newQuantity: quantity,
        });
        showNotification(response.data.message || "Product quantity updated successfully!", "success");
      }
  
      // Check if the price is different from the original price (stored in invisible field)
      if (price !== currentPrice) {
        const response = await api.post("/auth/products/edit-price", {
          productName: originalName,
          newPrice: price,
        });
        showNotification(response.data.message || "Product price updated successfully!", "success");
      }

      // Update the name if it's changed
      if (name !== originalName) {
        const response = await api.post("/auth/products/edit-name", {
          productName: originalName,
          newName: name,
        });
        showNotification(response.data.message || "Product name updated successfully!", "success");
      }
      fetchProducts(); // Refresh the product list
      setEditedProduct(null); // Close the modal
    } catch (error) {
      console.error("Error saving product:", error.message);
      showNotification(`Failed to update product due to ${error.message}.`, "error");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageFile = file; // Generate a URL for the file
      setNewProduct((prev) => ({
        ...prev,
        imageFile, // Set image URL for the product
      }));
      console.log("uploaded image! file = ", imageFile);
    }
  };
  

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <button
          className={`sidebar-button ${
            activeTab === "Dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "Users" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Users")}
        >
          Users
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "Products" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Products")}
        >
          Products
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "Vouchers Tasks" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Vouchers Tasks")}
        >
          Vouchers Tasks
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "Audit Logs" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Audit Logs")}
        >
          Audit Logs
        </button>
        <button
          className={`sidebar-button ${
            activeTab === "Report" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Reports")}
        >
          Reports
        </button>
        <div className="logout-container">
          <button
            className="logout-button"
            onClick={() => window.location.href = "/logout"}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === "Dashboard" && (
          <div>
            <h2>Admin Dashboard</h2>
            <div className="rounded-section">
              <h3>Statistics</h3>
              <p>Users using Minimart: {dashboardStats.currentUsers}</p>
              <p>Invitations Sent: {dashboardStats.invitationsAccepted + dashboardStats.invitationsNotAccepted}</p>
              <p>Invitations Accepted: {dashboardStats.invitationsAccepted}</p>
              <p>Invitations Not Accepted: {dashboardStats.invitationsNotAccepted}</p>
              <p>Pending Voucher Approvals: {dashboardStats.voucherTasksPending}</p>
              <p>Pending Product Requests: {dashboardStats.productRequestsPending}</p>
            </div>
          </div>
        )}


        {activeTab === "Audit Logs" && (
          <div>
            <h2>Audit Logs</h2>
            <div className="filter-section">
              <input
                type="text"
                placeholder="Search by name, email, or details"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={handleAuditSearch}>Search</button>

              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="all">All Actions</option>
                {actions.map((action, index) => (
                  <option key={index} value={action}>
                    {action}
                  </option>
                ))}
              </select>

              <div>
                <label>Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label>End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>


            <h3>Audit Logs</h3>
            <div className="audit-log-table">
              {filteredLogs.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr key={index}>
                        <td>{log.userName}</td>
                        <td>{log.userEmail}</td>
                        <td>{log.action}</td>
                        <td>{log.details}</td>
                        <td>{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No audit logs found matching the criteria.</p>
              )}
            </div>
          </div>
        )}


        {activeTab === "Users" && (
          <div>
            <h2>Manage Users</h2>

            {/* Add New User */}
            <div className="rounded-section">
              <h3>Add New User</h3>
              <input
                type="text"
                placeholder="Enter user name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Enter user email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="resident">Resident</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={handleAddUserManually}>Add User</button>
            </div>

            {/* Bulk Upload Users */}
            <div className="rounded-section">
              <h3>Bulk Upload Users</h3>
              <button onClick={handleDownloadTemplate} style={{ marginBottom: "10px" }}>
                Download Template
              </button>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setBulkFile(e.target.files[0])}
                style={{ display: "block", marginBottom: "10px" }}
              />
              <button onClick={handleBulkUpload}>Bulk Add Users</button>
            </div>

            {/* Display Failed Entries */}
            {failedEntries.length > 0 && (
              <div style={{ marginTop: "20px", color: "red" }}>
                <h3>Failed Entries</h3>
                <ul>
                  {failedEntries.map((entry, index) => (
                    <li key={index}>
                      <strong>{index + 1}:</strong> {entry.row.Name}, {entry.row.Email} —{" "}
                      {entry.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Search and Filters */}
            <div className="rounded-section">
              <h3>Filters</h3>
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={handleSearch}
              />
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="resident">Resident</option>
              </select>
              <select
                value={filterInvitation}
                onChange={(e) => setFilterInvitation(e.target.value)}
              >
                <option value="all">All Invitations</option>
                <option value="sent">Invitation Accepted</option>
                <option value="not-sent">Invitation Not Accepted</option>
              </select>
            </div>

            {/* User List */}
            <div className="rounded-section">
              <h3>User List</h3>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.email}
                    style={{
                      border: "1px solid #ccc",
                      padding: "10px",
                      marginBottom: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <p>
                      Name: {user.name} | Email: {user.email} | Role: {user.role}
                    </p>
                    <p>
                      Phone: {user.phoneNumber} | Invitation Accepted:{" "}
                      {user.invitationAccepted ? "Yes" : "No"}
                    </p>
                    <strong>Suspended:</strong> {user.suspended ? "Yes" : "No"}
                    
                    {/* Editable Fields */}
                    <div>
                      <label>Role:</label>
                      <select
                        value={editedUser?.email === user.email ? editedUser.role : user.role || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...user,
                            role: e.target.value,
                            phoneNumber: user.phoneNumber,
                            name: user.name,
                            email: user.email // Keep email for editing
                          })
                        }
                      >
                        <option value="resident">Resident</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label>Phone Number:</label>
                      <input
                        type="text"
                        value={
                          editedUser?.email === user.email
                            ? editedUser.phoneNumber || ""
                            : user.phoneNumber || ""
                        }
                        onChange={(e) =>
                          setEditedUser({
                            ...user,
                            phoneNumber: e.target.value,
                            role: user.role,
                            name: user.name,
                            email: user.email
                          })
                        }
                      />
                    </div>

                    <div>
                      <label>Name:</label>
                      <input
                        type="text"
                        value={editedUser?.email === user.email ? editedUser.name : user.name}
                        onChange={(e) =>
                          setEditedUser({
                            ...user,
                            name: e.target.value,
                            phoneNumber: user.phoneNumber,
                            role: user.role,
                            email: user.email
                          })
                        }
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => {
                          setConfirmPopup(true);
                          setPopupAction("save");
                          setEditedUser(editedUser);
                        }}
                      >
                        Save
                      </button>
                      {!user.suspended ? (
                        <button
                          onClick={() => {
                            setConfirmPopup(true);
                            setPopupAction("suspend");
                            setEditedUser(user);
                          }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setConfirmPopup(true);
                            setPopupAction("unsuspend");
                            setEditedUser(user);
                          }}
                        >
                          Unsuspend
                        </button>
                      )}
                      <button onClick={() => handleResetPassword(user.email, user.name)}>
                        Reset Password
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No users found</p>
              )}
            </div>

            {/* Confirmation Popup */}
            {confirmPopup && (
              <div
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
                  style={{
                    background: "#fff",
                    color: "#000",
                    padding: "20px",
                    borderRadius: "10px",
                    width: "400px",
                    textAlign: "center",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <h4>Confirm Action</h4>
                  <p>
                    Are you sure you want to{" "}
                    {popupAction === "suspend"
                      ? "suspend"
                      : popupAction === "unsuspend"
                      ? "unsuspend"
                      : "update"}{" "}
                    the user <b>{editedUser?.email}</b>?
                  </p>
                  <div style={{ marginTop: "20px" }}>
                    <button onClick={handleConfirm}>Confirm</button>
                    <button
                      onClick={() => {
                        setConfirmPopup(false);
                        setEditedUser(editedUser);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Products" && (
          <div>
            <h2>Manage Products</h2>
            <div className="rounded-section">
              <h3>Product List</h3>
              {/* Button to open the product creation modal */}
              <h2>Add a Product</h2>
              <button onClick={() => setShowModal(true)}>Add Product</button>
              {products.length > 0 ? (
                <div className="product-grid">
                {products.map((product) => (
                  <div className="product-card" key={product.name}>
                    <div className="product-image">
                      <img
                        src={product.imageUrl || "default-image.jpg"} // Display image or default
                        alt={product.name}
                        style={{ width: "100%", height: "auto" }} // Adjust size to fit nicely
                      />
                    </div>
                    <p><strong>Name:</strong> {product.name}</p>
                    <p><strong>Price:</strong> ${product.price}</p>
                    <p><strong>Quantity:</strong> {product.quantity}</p>
                    <div className="product-actions">
                      <button onClick={() => handleEditProduct(product)}>Edit</button>
                      <button onClick={() => handleDeleteProduct(product.name)}>Delete</button>
                    </div>
                  </div>
                ))}

                </div>
              ) : (
                <p>No products available.</p>
              )}
            </div>
          </div>
        )}

        {/* Product Creation Modal */}
        {showModal && (
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
              <h4>Create Product</h4>
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label>Price:</label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  placeholder="Enter product price"
                />
              </div>
              <div>
                <label>Quantity:</label>
                <input
                  type="number"
                  name="quantity"
                  value={newProduct.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter product quantity"
                />
              </div>

              <div>
                <label>Image:</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div>

              <div>
                <button onClick={handleAddProduct}>Add</button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
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
              <h4>Error</h4>
              <p>There was an issue creating the product. Please fill out all fields or the Product already Exists.</p>
              <button onClick={() => setShowErrorModal(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Modal for editing product */}
        {editedProduct && (
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
              <h4>Edit Product</h4>

              {/* Editable field for new name */}
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editedProduct.name}
                  onChange={handleProductChange}
                  placeholder="Enter New Name or Leave Blank"
                />
              </div>

              {/* Editable field for quantity */}
              <div>
                <label>Quantity:</label>
                <input
                  type="number"
                  name="quantity"
                  value={editedProduct.quantity}
                  onChange={handleProductChange}
                  placeholder="Enter Quantity"
                />
              </div>

              {/* Editable field for price */}
              <div>
                <label>Price:</label>
                <input
                  type="number"
                  name="price"
                  value={editedProduct.price}
                  onChange={handleProductChange}
                  placeholder="Enter Price"
                />
              </div>

              {/* Editable Image upload */}
              <div>
                <label>Product Image:</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
                {editedProduct.imageUrl && (
                  <img
                    src={editedProduct.imageUrl}
                    alt="Product Preview"
                    style={{ width: "100px", height: "auto", marginTop: "10px" }}
                  />
                )}
              </div>

              <div>
                <button onClick={handleSaveProduct}>Save</button>
                <button onClick={() => setEditedProduct(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;