import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/AdminDashboard.css";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import WeeklyRequestsChart from "../components/WeeklyRequestsChart";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUsers,
  faBox,
  faGavel,
  faList,
  faTasks,
  faClipboardList,
  faFileAlt,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons"

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
  const [originalName, setOriginalName] = useState('');
  const [searchTermProduct, setSearchTermProduct] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [sortCriteria, setSortCriteria] = useState("name"); // "name", "price", or "quantity"
  const [voucherTitle, setVoucherTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [voucherPoints, setVoucherPoints] = useState(0);
  const [voucherTasks, setVoucherTasks] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState({});
  const [unfulfilledRequests, setUnfulfilledRequests] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete modal
  const [productToDelete, setProductToDelete] = useState(null); // Product to delete
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [preorderRequests, setPreorderRequests] = useState([]);
  const [auctionRequests, setAuctionRequests] = useState([]);
  const [searchTermPurchase, setSearchTermPurchase] = useState("");
  const [searchTermPreorder, setSearchTermPreorder] = useState("");
  const [sortOrderPurchase, setSortOrderPurchase] = useState("asc");
  const [sortOrderPreorder, setSortOrderPreorder] = useState("asc");
  const [sortCriteriaPurchase, setSortCriteriaPurchase] = useState("createdAt");
  const [sortCriteriaPreorder, setSortCriteriaPreorder] = useState("createdAt");
  const [showDeleteVoucherModal, setShowDeleteVoucherModal] = useState(false);
  const [voucherTaskToDelete, setVoucherTaskToDelete] = useState(null);
  const [reportType, setReportType] = useState("weeklyRequests");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [reportData, setReportData] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [auctionDetails, setAuctionDetails] = useState({
    itemName: '',
    description: '',
    startingBid: '',
    endTime: '',
  });
  const [imageFile, setImageFile] = useState(null);




  useEffect(() => {
    if (activeTab === "Dashboard") {
      fetchDashboardStats();
    } else if (activeTab === "Users") {
      fetchUsers();
    } else if (activeTab === "Products") {
      fetchProducts();
    } else if (activeTab === "Audit Logs") {
      fetchAuditLogs();
      fetchActions();
    } else if (activeTab === "Product Requests") {
      fetchUnfulfilledRequests();
      fetchAllRequests();
    } else if (activeTab === "Voucher Tasks") {
      fetchVoucherTasks();
      fetchPendingApprovals();
    } else if (activeTab === "Reports") {
      fetchReportData();
    } else if (activeTab === 'Auction') {
      fetchAuctions();
    }
  
  }, [activeTab]);

  // Format timestamp in GMT+8
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const gmt8Offset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const gmt8Date = new Date(date.getTime() + gmt8Offset);

  return gmt8Date.toISOString().replace("T", " ").split(".")[0]; // Format: YYYY-MM-DD HH:mm:ss
};

const logAuditAction = async (action, details) => {
  try {
    await api.post("/auth/create-audit-log", {
      adminName: user.name,
      adminEmail: user.email,
      action,
      details,
      timestamp: formatTimestamp(Date.now()),
    });
  } catch (error) {
    console.error("Error logging audit action:", error.message);
  }
};

const fetchAuctions = async () => {
  try {
    const response = await api.get('/auth/auctions');
    setAuctions(response.data);
  } catch (error) {
    console.error('Error fetching auctions:', error.message);
  }
};

  const fetchReportData = async () => {
    try {
      let response;
      switch (reportType) {
        case "weeklyRequests":
          response = await api.get(`/auth/requests/all`);

          // console.log("Raw Data for Reports:", response.data);

          if (response.data) {
            const combinedRequests = [
              ...(response.data.purchaseRequests || []),
              ...(response.data.preorderRequests || []),
            ];
            setReportData(combinedRequests);
          } else {
            setReportData([]);
          }
          break;
        case "inventorySummary":
          response = await api.get(`/auth/products`);
          setReportData(response.data.products || []);
          break;
        case "voucherInsights":
          response = await api.get(`/auth/vouchers/insights`);
          setReportData(response.data || []);
          break;
        case "weeklyItemPurchase":
          response = await api.get(`/auth/requests/all`);
          setReportData(response.data.purchaseRequests || []);
          break;

        default:
          setReportData([]);
      }

      
    } catch (error) {
      console.error("Error fetching report data:", error.message);
      setReportData([]);
    }
  };

  const resetTimeToMidnight = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    return d;
  };


  const filterByDate = (data) => {
    if (!Array.isArray(data)) return [];
    const start = dateRange.start ? resetTimeToMidnight(new Date(dateRange.start)) : null;
    const end = dateRange.end ? resetTimeToMidnight(new Date(dateRange.end)) : null;
  
    return data.filter((item) => {
      const createdAt = resetTimeToMidnight(new Date(item.createdAt || item.timestamp));
      return (!start || createdAt >= start) && (!end || createdAt <= end);
    });
  };
  
  
  const filteredReportData = filterByDate(reportData);


  useEffect(() => {
    fetchReportData();
    // console.log("Report Data Updated:", reportData);
  }, [reportType]);
  
  
  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/auth/dashboard-stats");
      setDashboardStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await api.get("/auth/requests/all");
      setPurchaseRequests(response.data.purchaseRequests);
      setPreorderRequests(response.data.preorderRequests);
      setAuctionRequests(response.data.auctionRequests);
    } catch (error) {
      console.error("Error fetching requests:", error.message);
      showNotification("Failed to fetch requests.", "error");
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

  const fetchActions = async () => {
    try {
      const response = await api.get("/auth/audit-actions");
      setActions(response.data.actions);
    } catch (error) {
      console.error("Error fetching actions:", error.response?.data?.error || error.message);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get("/auth/vouchers/pending-approvals");
      setPendingApprovals(response.data);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      showNotification("Failed to fetch pending approvals.", "error");
    }
  };

  // Fetch unfulfilled product requests
const fetchUnfulfilledRequests = async () => {
  try {
    const response = await api.get("/auth/requests/unfulfilled");
    setUnfulfilledRequests(response.data.requests);
  } catch (error) {
    showNotification("Failed to fetch unfulfilled requests.", "error");
  }
};
  

  const handleSearch = (e) => setSearchTerm(e.target.value);


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
      showNotification("Bulk upload successful.", "success");
      setUsers((prev) => [...prev, ...response.data.users]);
      setFailedEntries(response.data.failedEntries); // Store failed entries
    } catch (error) {
      console.error("Error during bulk upload:", error);
      showNotification(`Bulk upload failed: ${error.message}`, "error");
    }
  };

  // Handle searching/filtering
  const handleAuditSearch = () => {
    fetchAuditLogs(); // Re-fetch based on new search/filter criteria
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

  const handleDeleteProduct = (product) => {
    setProductToDelete(product); // Set product to delete
    setShowDeleteModal(true); // Show delete confirmation modal
  };

  const deleteProduct = async (productName) => {
    try {
      const response = await api.delete("/auth/products/delete", {
        data: { productName, adminName: user.name, adminEmail: user.email },
      });
      showNotification(response.data.message || "Product deleted successfully.", "success");
      fetchProducts(); // Refresh the product list
      setShowDeleteModal(false); // Close the delete modal
    } catch (error) {
      console.error("Error deleting product:", error.message);
      showNotification(`Failed to delete product due to ${error.message}.`, "error");
      setShowDeleteModal(false); // Close the modal if error occurs
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
    formData.append("adminName", user.name);
    formData.append("adminEmail", user.email);
  
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
  setOriginalName(product.name);
};


const handleSaveProduct = async () => {
  if (!editedProduct) return;

  const { name, quantity, price, imageFile, imageUrl } = editedProduct;
  console.log("originalName = ", originalName);

  try {
    const formData = new FormData();
    formData.append("originalName", originalName);
    formData.append("name", name);
    formData.append("quantity", quantity);
    formData.append("price", price);
    // Append image only if a new image file is provided
    if (imageFile) {
      formData.append("image", imageFile);
    } else {
      formData.append("imageUrl", imageUrl); // Send existing image URL as a fallback
    }
    formData.append("adminName", user.name);
    formData.append("adminEmail", user.email);

    const response = await api.post("/auth/products/edit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    showNotification(response.data.message || "Product updated successfully!", "success");
    fetchProducts(); // Refresh product list
    setEditedProduct(null); // Close the edit modal
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

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageFile = file; // Generate a URL for the file
      setEditedProduct((prev) => ({
        ...prev,
        imageFile, // Set image URL for the product
      }));
      console.log("uploaded image! file = ", imageFile);
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


  const fetchVoucherTasks = async () => {
    try {
      const response = await api.get("/auth/vouchers/tasks");
      setVoucherTasks(response.data);
      console.log("VoucherTasks = ", voucherTasks);
    } catch (error) {
      showNotification("Failed to fetch voucher tasks.", "error");
    }
  };
  
  const handleCreateVoucherTask = async () => {
    try {
      await api.post("/auth/vouchers/create", {
        title: voucherTitle,
        description: taskDescription,
        maxAttempts,
        points: voucherPoints,
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification("Voucher task created successfully.", "success");
      fetchVoucherTasks();
    } catch (error) {
      showNotification("Failed to create voucher task.", "error");
    }
  };

  const handleEditTask = (task) => {
    setEditTask({ ...task }); // Ensure the task data is correctly set in the state
    setIsEditModalOpen(true); // Open the modal
    console.log("EditModal = ", isEditModalOpen);

  };
  
  const handleApproveAttempt = async (attemptId) => {
    try {
      await api.post(`/auth/vouchers/approve-attempt/${attemptId}`, {
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification("Attempt approved successfully.", "success");
      fetchPendingApprovals();
    } catch (error) {
      console.error("Error approving attempt:", error);
      showNotification("Failed to approve attempt.", "error");
    }
  };
  
  const handleRejectAttempt = async (attemptId) => {
    try {
      await api.post(`/auth/vouchers/reject-attempt/${attemptId}`, {
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification("Attempt rejected successfully.", "success");
      fetchPendingApprovals();
    } catch (error) {
      console.error("Error rejecting attempt:", error);
      showNotification("Failed to reject attempt.", "error");
    }
  };
  
  
  
  const handleUpdateTask = async () => {
    try {
      await api.post(`/auth/vouchers/edit/${editTask.id}`, {
        ...editTask,
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification("Task updated successfully.", "success");
      fetchVoucherTasks();
      setIsEditModalOpen(false);
    } catch (error) {
      showNotification("Failed to update task.", "error");
    }
  };
  
  const deleteVoucherTask = async (taskId) => {
    try {
      await api.delete(`/auth/vouchers/delete/${taskId}`, {
        data: { adminName: user.name, adminEmail: user.email },
      });
      showNotification("Voucher task deleted successfully.", "success");
      fetchVoucherTasks(); // Refresh the list of voucher tasks
    } catch (error) {
      console.error("Error deleting voucher task:", error.message);
      showNotification("Failed to delete voucher task.", "error");
    }
  };
  

  const handleDeleteTask = (task) => {
    setVoucherTaskToDelete(task); // Set the task to delete
    setShowDeleteVoucherModal(true); // Show the delete confirmation modal
  };
  

  const filteredSortedPurchaseRequests = purchaseRequests
  .filter((request) =>
    request.productName.toLowerCase().includes(searchTermPurchase.toLowerCase())
  )
  .sort((a, b) => {
    let fieldA = a[sortCriteriaPurchase];
    let fieldB = b[sortCriteriaPurchase];

    if (sortCriteriaPurchase === "createdAt") {
      fieldA = new Date(a.createdAt);
      fieldB = new Date(b.createdAt);
    }

    return sortOrderPurchase === "asc"
      ? fieldA > fieldB
        ? 1
        : -1
      : fieldA < fieldB
      ? 1
      : -1;
  });

  const filteredSortedPreorderRequests = preorderRequests
  .filter((request) =>
    request.productName.toLowerCase().includes(searchTermPreorder.toLowerCase())
  )
  .sort((a, b) => {
    let fieldA = a[sortCriteriaPreorder];
    let fieldB = b[sortCriteriaPreorder];

    if (sortCriteriaPreorder === "createdAt") {
      fieldA = new Date(a.createdAt);
      fieldB = new Date(b.createdAt);
    }

    return sortOrderPreorder === "asc"
      ? fieldA > fieldB
        ? 1
        : -1
      : fieldA < fieldB
      ? 1
      : -1;
  });

  const handleApprovePurchaseRequest = async (request) => {
    try {
      await api.post(`/auth/requests/purchase/approve/${request.requestId}`, {
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification(`Purchase request for ${request.productName} approved.`, "success");
      fetchAllRequests(); // Refresh the request list
    } catch (error) {
      console.error("Error approving purchase request:", error.message);
      showNotification("Failed to approve purchase request.", "error");
    }
  };
  
  
  const handleApprovePreorderRequest = async (request) => {
    try {
      await api.post(`/auth/requests/preorder/approve/${request.requestId}`, {
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification(`Preorder request for ${request.productName} approved.`, "success");
      fetchAllRequests(); // Refresh the request list
    } catch (error) {
      console.error("Error approving preorder request:", error.message);
      showNotification("Failed to approve preorder request.", "error");
    }
  };
  
  const handleRejectPreorderRequest = async (request) => {
    try {
      await api.post(`/auth/requests/preorder/reject/${request.requestId}`, {
        adminName: user.name,
        adminEmail: user.email,
      });
      showNotification(`Preorder request for ${request.productName} rejected.`, "success");
      fetchAllRequests(); // Refresh the request list
    } catch (error) {
      console.error("Error rejecting preorder request:", error.message);
      showNotification("Failed to reject preorder request.", "error");
    }
  };


  const WeeklyItemPurchaseReport = ({ data }) => (
    <div>
      <h3>Weekly Item Purchase</h3>
      <table>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Purchase Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((request, index) => (
            <tr key={index}>
              <td>{request.userName}</td>
              <td>{request.productName}</td>
              <td>{request.quantity}</td>
              <td>{new Date(request.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  const InventorySummaryReport = ({ data }) => (
    <div>
      <h3>Inventory Summary</h3>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product, index) => (
            <tr key={index} style={{ color: product.quantity === 0 ? "red" : "inherit" }}>
              <td>{product.name || "Unknown"}</td>
              <td>{product.quantity || 0}</td>
              <td>${product.price ? product.price.toFixed(2) : "0.00"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  

const VoucherInsightsReport = ({ data }) => (
  <div>
    <h3>Voucher Insights</h3>
    {data.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Points</th>
            <th>Unique Users</th>
            <th>Approved</th>
            <th>Pending</th>
            <th>Rejected</th>
            <th>Total Points Distributed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((voucher, index) => (
            <tr key={index}>
              <td>{voucher.title}</td>
              <td>{voucher.description}</td>
              <td>{voucher.points}</td>
              <td>{voucher.uniqueUsers}</td>
              <td>{voucher.approvedCount}</td>
              <td>{voucher.pendingCount}</td>
              <td>{voucher.rejectedCount}</td>
              <td>{voucher.totalPointsDistributed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>No voucher insights available.</p>
    )}
  </div>
);

const headerMapping = {
  weeklyRequests: {
    userName: "User Name",
    productName: "Product Name",
    quantity: "Quantity",
    createdAt: "Requested Date",
  },
  inventorySummary: {
    name: "Product Name",
    quantity: "Quantity",
    price: "Price",
  },
  voucherInsights: {
    title: "Title",
    description: "Description",
    points: "Points",
    uniqueUsers: "Unique Users",
    approvedCount: "Approved",
    pendingCount: "Pending",
    rejectedCount: "Rejected",
    totalPointsDistributed: "Total Points Distributed",
  },
  weeklyItemPurchase: {
    userName: "User Name",
    productName: "Product Name",
    quantity: "Quantity",
    createdAt: "Purchase Date",
  },
};



const exportReportPDF = (data, title, headers, dateRange, actionDetails) => {
  const doc = new jsPDF();
  const currentTimestamp = formatTimestamp(Date.now());
  
  const userFriendlyHeaders = Object.values(headers);
  const mappedData = data.map((row) =>
    Object.keys(headers).map((key) => (row[key] === 0 ? 0 : row[key] || "N/A"))
  );

  doc.text(title, 14, 10);
  doc.text(`Generated on: ${currentTimestamp} (GMT+8)`, 14, 20);
  if (dateRange.start || dateRange.end) {
    doc.text(
      `Date Range: ${dateRange.start || "N/A"} to ${dateRange.end || "N/A"}`,
      14,
      30
    );
  }

  autoTable(doc, {
    startY: 40,
    head: [userFriendlyHeaders],
    body: mappedData,
  });

  doc.save(`${title.replace(" ", "_").toLowerCase()}_${currentTimestamp}.pdf`);

  logAuditAction("Export PDF", actionDetails);
};

const exportReportCSV = (data, headers, fileName, dateRange, actionDetails) => {
  const currentTimestamp = formatTimestamp(Date.now());
  const userFriendlyHeaders = Object.values(headers);
  const mappedData = data.map((row) =>
    Object.keys(headers).map((key) => (row[key] === 0 ? 0 : row[key] || ""))
  );

  const csvContent = [
    `Report: ${fileName}`,
    `Generated on: ${currentTimestamp} (GMT+8)`,
    dateRange.start || dateRange.end
      ? `Date Range: ${dateRange.start || "N/A"} to ${dateRange.end || "N/A"}`
      : "",
    userFriendlyHeaders.join(","),
    ...mappedData.map((row) => row.join(",")),
  ]
    .filter((line) => line)
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `${fileName}_${currentTimestamp.replace(/:/g, "-")}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logAuditAction("Export CSV", actionDetails);
};

const exportReportPDFWithChart = async (chartRef, data, title, headers, dateRange, actionDetails) => {
  const doc = new jsPDF();
  const currentTimestamp = formatTimestamp(Date.now());
  
  // Include metadata at the top
  doc.text(title, 14, 10);
  doc.text(`Generated on: ${currentTimestamp} (GMT+8)`, 14, 20);
  if (dateRange.start || dateRange.end) {
    doc.text(
      `Date Range: ${dateRange.start || "N/A"} to ${dateRange.end || "N/A"}`,
      14,
      30
    );
  }

  // Capture chart as an image
  if (chartRef && chartRef.current) {
    const chartCanvas = await html2canvas(chartRef.current);
    const chartImage = chartCanvas.toDataURL("image/png");

    // Add the chart image to the PDF
    doc.addImage(chartImage, "PNG", 10, 40, 190, 90); // Adjust dimensions as needed
  }

  // Include table data below the chart
  const userFriendlyHeaders = Object.values(headers);
  const mappedData = data.map((row) =>
    Object.keys(headers).map((key) => row[key] === 0 ? 0 : row[key] || "N/A")
  );

  doc.autoTable({
    startY: 140, // Start below the chart
    head: [userFriendlyHeaders],
    body: mappedData,
  });

  doc.save(`${title.replace(" ", "_").toLowerCase()}_${currentTimestamp}.pdf`);

  // Log the action
  logAuditAction("Export PDF with Chart", actionDetails);
};


const handleCreateAuction = async () => {
  const { itemName, description, startingBid, endTime } = auctionDetails;

  if (!itemName || !description || !startingBid || !endTime || !imageFile) {
    showNotification('All fields and an image are required.', "error");
    return;
  }

  const formData = new FormData();
  formData.append('itemName', itemName);
  formData.append('description', description);
  formData.append('startingBid', parseFloat(startingBid));
  formData.append('endTime', endTime);
  formData.append('image', imageFile);
  formData.append('adminName', user.name);
  formData.append('adminEmail', user.email);

  try {
    await api.post('/auth/auctions/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    showNotification('Auction created successfully.', "success");
    fetchAuctions();
    setAuctionDetails({ itemName: '', description: '', startingBid: '', endTime: '' });
    setImageFile(null);
  } catch (error) {
    console.error('Error creating auction:', error.message);
    showNotification(`Error creating auction: ${error.message}`, "success");
  }
};

const handleEndAuction = async (auctionId) => {
  try {
    await api.post('/auth/auctions/end', {
      auctionId,
      adminName: user.name,
      adminEmail: user.email,
    });
    showNotification('Auction ended successfully.', "success");
    fetchAuctions();
  } catch (error) {
    console.error('Error ending auction:', error.message);
    showNotification(`Error ending auction: ${error.message}`, "success");
  }
};


const handleFulfillAuctionRequest = async (request) => {
  try {
    await api.post(`/auth/requests/auction/fulfill/${request.requestId}`, {
      adminName: user.name,
      adminEmail: user.email,
    });
    showNotification(`Auction request for ${request.productName} fulfilled.`, "success");
    fetchAllRequests(); // Refresh the request list
  } catch (error) {
    console.error("Error fulfilling auction request:", error.message);
    showNotification("Failed to fulfill auction request.", "error");
  }
};




  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <button
          className={`sidebar-button ${activeTab === "Dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("Dashboard")}
        >
          <FontAwesomeIcon icon={faHome} className="sidebar-icon" />
          Dashboard
        </button>
        <button
          className={`sidebar-button ${activeTab === "Users" ? "active" : ""}`}
          onClick={() => setActiveTab("Users")}
        >
          <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
          Users
        </button>
        <button
          className={`sidebar-button ${activeTab === "Products" ? "active" : ""}`}
          onClick={() => setActiveTab("Products")}
        >
          <FontAwesomeIcon icon={faBox} className="sidebar-icon" />
          Products
        </button>
        <button
          className={`sidebar-button ${activeTab === "Auction" ? "active" : ""}`}
          onClick={() => setActiveTab("Auction")}
        >
          <FontAwesomeIcon icon={faGavel} className="sidebar-icon" />
          Auction
        </button>
        <button
          className={`sidebar-button ${activeTab === "Product Requests" ? "active" : ""}`}
          onClick={() => setActiveTab("Product Requests")}
        >
          <FontAwesomeIcon icon={faList} className="sidebar-icon" />
          Product Requests
        </button>
        <button
          className={`sidebar-button ${activeTab === "Voucher Tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("Voucher Tasks")}
        >
          <FontAwesomeIcon icon={faTasks} className="sidebar-icon" />
          Voucher Tasks
        </button>
        <button
          className={`sidebar-button ${activeTab === "Audit Logs" ? "active" : ""}`}
          onClick={() => setActiveTab("Audit Logs")}
        >
          <FontAwesomeIcon icon={faClipboardList} className="sidebar-icon" />
          Audit Logs
        </button>
        <button
          className={`sidebar-button ${activeTab === "Reports" ? "active" : ""}`}
          onClick={() => setActiveTab("Reports")}
        >
          <FontAwesomeIcon icon={faFileAlt} className="sidebar-icon" />
          Reports
        </button>
        <div className="logout-container">
          <button
            className="logout-button"
            onClick={() => window.location.href = "/logout"}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="sidebar-icon" />
            Log Out
          </button>
        </div>
      </div>


      {/* Main Content */}
      <div className="main-content">
      {activeTab === "Dashboard" && (
        <div className="dashboard">
          <h2>Admin Dashboard</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card" onClick={() => setActiveTab("Users")}>
              <h3>Users</h3>
              <p>Total Users: <strong>{dashboardStats.totalUsers || 0}</strong></p>
              <p>Invitations Accepted: <strong>{dashboardStats.invitationsAccepted || 0}</strong></p>
              <p>Invitations Not Accepted: <strong>{dashboardStats.invitationsNotAccepted || 0}</strong></p>
              <button className="button">Go to Users</button>
            </div>
            <div className="dashboard-card" onClick={() => setActiveTab("Products")}>
              <h3>Products</h3>
              <p>Active Products: <strong>{dashboardStats.activeProducts || 0}</strong></p>
              <button className="button">Go to Products</button>
            </div>
            <div className="dashboard-card" onClick={() => setActiveTab("Product Requests")}>
              <h3>Product Requests</h3>
              <p>Total Requests: <strong>{dashboardStats.productRequests?.total || 0}</strong></p>
              <p>Purchase Requests: <strong>{dashboardStats.productRequests?.purchase || 0}</strong></p>
              <p>Preorder Requests: <strong>{dashboardStats.productRequests?.preorder || 0}</strong></p>
              <p>Auction Requests: <strong>{dashboardStats.productRequests?.auction || 0}</strong></p>
              <button className="button">Go to Product Requests</button>
            </div>
            <div className="dashboard-card" onClick={() => setActiveTab("Voucher Tasks")}>
              <h3>Voucher Tasks</h3>
              <p>Active Tasks: <strong>{dashboardStats.activeVoucherTasks || 0}</strong></p>
              <button className="button">Go to Voucher Tasks</button>
            </div>
            <div className="dashboard-card" onClick={() => setActiveTab("Audit Logs")}>
              <h3>Audit Logs</h3>
              <p>Review system actions and logs.</p>
              <button className="button">Go to Audit Logs</button>
            </div>
            <div className="dashboard-card" onClick={() => setActiveTab("Reports")}>
              <h3>Reports</h3>
              <p>Generate and view detailed reports.</p>
              <button className="button">Go to Reports</button>
            </div>
          </div>
        </div>
      )}


      {activeTab === "Auction" && (
        <div className="auction-management">
          <h2>Manage Auctions</h2>
          
          {/* Auction Form */}
          <div className="auction-form">
            <input
              type="text"
              placeholder="Item Name"
              value={auctionDetails.itemName}
              onChange={(e) =>
                setAuctionDetails({ ...auctionDetails, itemName: e.target.value })
              }
            />
            <textarea
              placeholder="Description"
              value={auctionDetails.description}
              onChange={(e) =>
                setAuctionDetails({ ...auctionDetails, description: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Starting Bid"
              value={auctionDetails.startingBid}
              onChange={(e) =>
                setAuctionDetails({ ...auctionDetails, startingBid: e.target.value })
              }
            />
            <input
              type="datetime-local"
              placeholder="End Time"
              value={auctionDetails.endTime}
              onChange={(e) =>
                setAuctionDetails({ ...auctionDetails, endTime: e.target.value })
              }
            />
            <input
              type="file"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            <button onClick={handleCreateAuction}>Create Auction</button>
          </div>

          {/* Active Auctions */}
          <div className="active-auctions">
            <h3>Active Auctions</h3>
            {auctions.map((auction) => (
              <div className="auction-card" key={auction.id}>
                <img src={auction.imageUrl} alt={auction.itemName} />
                <p>
                  <strong>{auction.itemName}</strong>
                </p>
                <p>{auction.description}</p>
                <p>Current Bid: {auction.currentBid}</p>
                <p>Highest Bidder: {auction.highestBidder || "None"}</p>
                <button onClick={() => handleEndAuction(auction.id)}>
                  End Auction
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {activeTab === "Reports" && (
        <div className="reports-container">
          <h2>Reports</h2>

          {/* Controls Section */}
          <div className="report-controls">
            <label>Select Report Type:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="weeklyRequests">Weekly Requests</option>
              <option value="weeklyItemPurchase">Weekly Item Purchase</option>
              <option value="inventorySummary">Inventory Summary</option>
              <option value="voucherInsights">Voucher Insights</option>
            </select>

            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
            />

            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
            />

            <div className="export-buttons">
              <button
                onClick={() => {
                  const headers = headerMapping[reportType];
                  exportReportCSV(
                    filteredReportData,
                    headers,
                    `${reportType}_report`,
                    dateRange,
                    `Exported ${reportType} report as CSV.`
                  );
                  logAuditAction("Export CSV", `Exported ${reportType} report.`);
                }}
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  const headers = headerMapping[reportType];
                  exportReportPDF(
                    filteredReportData,
                    `${reportType} Report`,
                    headers,
                    dateRange,
                    `Exported ${reportType} report as PDF.`
                  );
                  logAuditAction("Export PDF", `Exported ${reportType} report.`);
                }}
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="report-content">
            {filteredReportData.length > 0 ? (
              <>
                {reportType === "weeklyRequests" && (
                  <WeeklyRequestsChart data={filteredReportData} />
                )}
                {reportType === "weeklyItemPurchase" && (
                  <table>
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Purchase Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.userName}</td>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === "inventorySummary" && (
                  <table>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name || "Unknown"}</td>
                          <td>{item.quantity || 0}</td>
                          <td>
                            $
                            {(item.price !== undefined && item.price !== null
                              ? item.price
                              : 0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {reportType === "voucherInsights" && (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Points</th>
                        <th>Unique Users</th>
                        <th>Approved</th>
                        <th>Pending</th>
                        <th>Rejected</th>
                        <th>Total Points Distributed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.title}</td>
                          <td>{item.description}</td>
                          <td>{item.points}</td>
                          <td>{item.uniqueUsers}</td>
                          <td>{item.approvedCount}</td>
                          <td>{item.pendingCount}</td>
                          <td>{item.rejectedCount}</td>
                          <td>{item.totalPointsDistributed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <p>No data available. Please generate a report.</p>
            )}
          </div>
        </div>
      )}


      {activeTab === "Voucher Tasks" && (
        <div className="voucher-tasks-container">
          <h2>Manage Voucher Tasks</h2>

          {/* Create Voucher Task */}
          <div className="create-voucher-form">
            <h3>Create Voucher Task</h3>
            <input
              type="text"
              placeholder="Voucher Title"
              value={voucherTitle}
              onChange={(e) => setVoucherTitle(e.target.value)}
            />
            <textarea
              placeholder="Task Description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            ></textarea>
            <input
              type="number"
              placeholder="Max Attempts"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
            />
            <input
              type="number"
              placeholder="Points"
              value={voucherPoints}
              onChange={(e) => setVoucherPoints(e.target.value)}
            />
            <button onClick={handleCreateVoucherTask}>Create Task</button>
          </div>

          {/* Current Active Tasks */}
          <h3>Active Voucher Tasks</h3>
          {voucherTasks
            .filter((task) => task.status === "active")
            .map((task) => (
              <div key={task.id} className="voucher-task-card">
                <p><strong>{task.title}</strong></p>
                <p>{task.description}</p>
                <p>Max Attempts: {task.maxAttempts}</p>
                <p>Points: {task.points}</p>
                <button onClick={() => handleEditTask(task)}>Edit</button>
                <button onClick={() => handleDeleteTask(task)}>Delete</button>
              </div>
            ))}

          {/* Pending Approvals */}
          <h3>Pending Approvals</h3>
          {pendingApprovals.length === 0 ? (
            <p>No pending approvals.</p>
          ) : (
            pendingApprovals.map((attempt) => (
              <div key={attempt.attemptId} className="voucher-approval-card">
                <p><strong>Task Title:</strong> {attempt.taskTitle}</p>
                <p><strong>Description:</strong> {attempt.taskDescription}</p>
                <p><strong>Points:</strong> {attempt.taskPoints}</p>
                <p><strong>Resident:</strong> {attempt.userName} ({attempt.userEmail})</p>
                <img src={attempt.imageProofUrl} alt="Proof" />
                <div className="approval-buttons">
                  <button onClick={() => handleApproveAttempt(attempt.attemptId)}>Approve</button>
                  <button onClick={() => handleRejectAttempt(attempt.attemptId)}>Reject</button>
                </div>
              </div>
            ))
          )}

          {/* Edit Modal */}
          {isEditModalOpen && (
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
                <h3>Edit Voucher Task</h3>
                <div>
                  <label>Voucher Title:</label>
                  <input
                    type="text"
                    value={editTask.title || ""}
                    onChange={(e) =>
                      setEditTask({ ...editTask, title: e.target.value })
                    }
                    placeholder="Voucher Title"
                  />
                </div>
                <div>
                  <label>Task Description:</label>
                  <textarea
                    value={editTask.description || ""}
                    onChange={(e) =>
                      setEditTask({ ...editTask, description: e.target.value })
                    }
                    placeholder="Task Description"
                  ></textarea>
                </div>
                <div>
                  <label>Max Attempts:</label>
                  <input
                    type="number"
                    value={editTask.maxAttempts || 0}
                    onChange={(e) =>
                      setEditTask({ ...editTask, maxAttempts: e.target.value })
                    }
                    placeholder="Max Attempts"
                  />
                </div>
                <div>
                  <label>Points:</label>
                  <input
                    type="number"
                    value={editTask.points || 0}
                    onChange={(e) =>
                      setEditTask({ ...editTask, points: e.target.value })
                    }
                    placeholder="Points"
                  />
                </div>
                <div>
                  <button onClick={handleUpdateTask}>Save</button>
                  <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteVoucherModal && voucherTaskToDelete && (
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
                <h4>Are you sure you want to delete the voucher task: "{voucherTaskToDelete.title}"?</h4>
                <div>
                  <button
                    onClick={() => {
                      deleteVoucherTask(voucherTaskToDelete.id); // Perform the delete action
                      setShowDeleteVoucherModal(false); // Close the modal
                    }}
                  >
                    Confirm
                  </button>
                  <button onClick={() => setShowDeleteVoucherModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Audit Logs" && (
        <div className="audit-logs-container">
          <h2>Audit Logs</h2>

          {/* Filter Section */}
          <div className="filter-section">
            <input
              type="text"
              placeholder="Search by name, email, or details"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={handleAuditSearch}>Search</button>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
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

          {/* Audit Log Table */}
          <h3>Audit Logs</h3>
          <div className="audit-log-table-wrapper">
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
                        <td
                          className="details-column"
                          data-full-text={log.details}
                          title={log.details} // Fallback for browsers without `data-full-text` support
                        >
                          {log.details.length > 50
                            ? `${log.details.substring(0, 50)}...`
                            : log.details}
                        </td>
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
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.6)", // Slightly darker overlay
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: "30px",
                    borderRadius: "12px",
                    width: "400px",
                    textAlign: "center",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", // Deeper shadow for prominence
                  }}
                >
                  <h4 style={{ color: "#2c3e50", marginBottom: "20px" }}>Confirm Action</h4>
                  <p style={{ color: "#7f8c8d", fontSize: "14px", marginBottom: "20px" }}>
                    Are you sure you want to{" "}
                    {popupAction === "suspend"
                      ? "suspend"
                      : popupAction === "unsuspend"
                      ? "unsuspend"
                      : "update"}{" "}
                    the user <b>{editedUser?.email}</b>?
                  </p>
                  <div>
                    <button
                      style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#3498db", // Blue for Confirm
                        border: "none",
                        borderRadius: "5px",
                        marginRight: "10px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                      }}
                      onClick={handleConfirm}
                    >
                      Confirm
                    </button>
                    <button
                      style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#e74c3c", // Red for Cancel
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                      }}
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

        {activeTab === "Product Requests" && (
          <div className="product-requests-container">
            <h2>Manage Product Requests</h2>

            {/* Purchase Requests Section */}
            <div className="request-section">
              <h3>Purchase Requests</h3>
              <div className="controls">
                <input
                  type="text"
                  placeholder="Search Purchase Requests..."
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
                  <option value="createdAt">Date</option>
                </select>
                <button onClick={() => setSortOrderPurchase((prev) => (prev === "asc" ? "desc" : "asc"))}>
                  Sort: {sortOrderPurchase === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
              <table className="transaction-history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedPurchaseRequests.map((request, index) => (
                    <tr key={index}>
                      <td>{request.userName}</td>
                      <td>{request.productName}</td>
                      <td>{request.quantity}</td>
                      <td>{new Date(request.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleApprovePurchaseRequest(request)}>Fulfilled</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preorder Requests Section */}
            <div className="request-section">
              <h3>Preorder Requests</h3>
              <div className="controls">
                <input
                  type="text"
                  placeholder="Search Preorder Requests..."
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
                  <option value="createdAt">Date</option>
                </select>
                <button onClick={() => setSortOrderPreorder((prev) => (prev === "asc" ? "desc" : "asc"))}>
                  Sort: {sortOrderPreorder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
              <table className="transaction-history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedPreorderRequests.map((request, index) => (
                    <tr key={index}>
                      <td>{request.userName}</td>
                      <td>{request.productName}</td>
                      <td>{request.quantity}</td>
                      <td className={`status-${request.status.toLowerCase()}`}>{request.status}</td>
                      <td>{new Date(request.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleApprovePreorderRequest(request)}>Approve</button>
                        <button onClick={() => handleRejectPreorderRequest(request)}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Auction Requests Section */}
            <div className="request-section">
              <h3>Auction Requests</h3>
              <table className="transaction-history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Winning Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctionRequests.map((request, index) => (
                    <tr key={index}>
                      <td>{request.userName}</td>
                      <td>{request.productName}</td>
                      <td className={`status-${request.status.toLowerCase()}`}>{request.status}</td>
                      <td>{new Date(request.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleFulfillAuctionRequest(request)}>Fulfill</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {activeTab === "Products" && (
          <div className="product-management-container">
            <h2>Manage Products</h2>

            {/* Search and Sort Controls */}
            <div className="product-controls">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTermProduct}
                onChange={handleSearchChange}
                className="search-bar"
              />
              <div className="sort-controls">
                <select
                  value={sortCriteria}
                  onChange={handleSortCriteriaChange}
                  className="sort-criteria"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="quantity">Quantity</option>
                </select>
                <button onClick={toggleSortOrder} className="sort-button">
                  Sort: {sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>

            <div className="rounded-section">
              <h3>Product List</h3>
              <button
                className="add-product-button"
                onClick={() => setShowModal(true)}
              >
                Add Product
              </button>

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
                        <button
                          className="edit-button"
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No products available.</p>
              )}
            </div>

            {/* Product Creation Modal */}
            {showModal && (
              <div
                style={{
                  position: "fixed",
                  top: "0",
                  left: "0",
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.7)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: "1000",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    width: "400px",
                    maxWidth: "90%",
                    textAlign: "center",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && productToDelete && (
              <div
                style={{
                  position: "fixed",
                  top: "0",
                  left: "0",
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.7)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: "1000",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    width: "400px",
                    maxWidth: "90%",
                    textAlign: "center",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <h4>Are you sure you want to delete {productToDelete.name}?</h4>
                  <div>
                    <button
                      style={{
                        padding: "10px 20px",
                        marginRight: "10px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#e74c3c",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => deleteProduct(productToDelete.name)}
                    >
                      Confirm
                    </button>
                    <button
                      style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#3498db",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
              <div
                style={{
                  position: "fixed",
                  top: "0",
                  left: "0",
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.7)", // Darker overlay
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: "1000",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    width: "400px",
                    maxWidth: "90%",
                    textAlign: "center",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", // Shadow for depth
                  }}
                >
                  <h4 style={{ color: "#e74c3c", marginBottom: "20px" }}>Error</h4>
                  <p style={{ color: "#7f8c8d", fontSize: "14px", marginBottom: "20px" }}>
                    There was an issue creating the product. Please fill out all fields or the product already exists.
                  </p>
                  <button
                    style={{
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#ffffff",
                      backgroundColor: "#e74c3c",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowErrorModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Modal for editing product */}
            {editedProduct && (
              <div
                style={{
                  position: "fixed",
                  top: "0",
                  left: "0",
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.7)", // Darker overlay
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: "1000",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    width: "400px",
                    maxWidth: "90%",
                    textAlign: "center",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", // Shadow for depth
                  }}
                >
                  <h4 style={{ marginBottom: "20px", color: "#2c3e50" }}>Edit Product</h4>

                  {/* Editable field for new name */}
                  <div style={{ marginBottom: "15px" }}>
                    <label>Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={editedProduct.name}
                      onChange={handleProductChange}
                      placeholder="Enter new name or leave blank"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "14px",
                        marginTop: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  {/* Editable field for quantity */}
                  <div style={{ marginBottom: "15px" }}>
                    <label>Quantity:</label>
                    <input
                      type="number"
                      name="quantity"
                      value={editedProduct.quantity}
                      onChange={handleProductChange}
                      placeholder="Enter quantity"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "14px",
                        marginTop: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  {/* Editable field for price */}
                  <div style={{ marginBottom: "15px" }}>
                    <label>Price:</label>
                    <input
                      type="number"
                      name="price"
                      value={editedProduct.price}
                      onChange={handleProductChange}
                      placeholder="Enter price"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "14px",
                        marginTop: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  {/* Editable Image upload */}
                  <div style={{ marginBottom: "15px" }}>
                    <label>Product Image:</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleEditImageUpload}
                      accept="image/*"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "14px",
                        marginTop: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                      }}
                    />
                    {editedProduct.imageUrl && (
                      <img
                        src={editedProduct.imageUrl}
                        alt="Product Preview"
                        style={{
                          width: "100px",
                          height: "auto",
                          marginTop: "10px",
                          borderRadius: "5px",
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <button
                      style={{
                        padding: "10px 20px",
                        marginRight: "10px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#3498db",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                      onClick={handleSaveProduct}
                    >
                      Save
                    </button>
                    <button
                      style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        backgroundColor: "#e74c3c",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => setEditedProduct(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;