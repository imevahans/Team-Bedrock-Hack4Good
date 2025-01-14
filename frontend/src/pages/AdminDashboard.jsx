import React, { useState, useEffect } from "react";
import api from "../services/api";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("resident");
  const [searchTerm, setSearchTerm] = useState("");
  const [editedUser, setEditedUser] = useState(null);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(""); // Action for confirmation popup
  const [bulkFile, setBulkFile] = useState(null); // File for bulk upload
  const [failedEntries, setFailedEntries] = useState([]); // Track failed entries


  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/auth/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
      }
    };

    fetchUsers();
  }, []);

  // Add new user
  const handleAddUser = async () => {
    try {
      const response = await api.post("/auth/add-user", { email, role });
      setMessage(response.data.message);
      setUsers((prev) => [...prev, response.data.user]);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to add user.");
    }
  };

  // Suspend user
  const handleSuspendUser = async (email) => {
    try {
      const response = await api.post("/auth/suspend-user", { email });
      setMessage(response.data.message);
      setUsers((prev) =>
        prev.map((user) => (user.email === email ? { ...user, suspended: true } : user))
      );
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to suspend user.");
    }
  };

  // Unsuspend user
  const handleUnsuspendUser = async (email) => {
    try {
      const response = await api.post("/auth/unsuspend-user", { email });
      setMessage(response.data.message);
      setUsers((prev) =>
        prev.map((user) => (user.email === email ? { ...user, suspended: false } : user))
      );
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to unsuspend user.");
    }
  };

  // Reset password
  const handleResetPassword = async (email) => {
    try {
      const response = await api.post("/auth/reset-password-admin", { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to reset password.");
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim()) {
      try {
        const response = await api.get("/auth/search-users", { params: { term } });
        setUsers(response.data);
      } catch (error) {
        setMessage(error.response?.data?.error || "Failed to search users.");
      }
    } else {
      const response = await api.get("/auth/users");
      setUsers(response.data);
    }
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!editedUser?.email) return;

    try {
      const payload = {
        email: editedUser.email,
        role: editedUser.role || null,
        phoneNumber: editedUser.phoneNumber || null,
        confirmation: "yes",
      };

      const response = await api.post("/auth/update-user", payload);
      setMessage(response.data.message);
      setUsers((prev) =>
        prev.map((user) =>
          user.email === editedUser.email
            ? { ...user, role: editedUser.role, phoneNumber: editedUser.phoneNumber }
            : user
        )
      );
      setConfirmPopup(false);
      setEditedUser(null);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to save changes.");
    }
  };

  // Handle confirmation
  const handleConfirm = () => {
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
};

// Bulk upload users
const handleBulkUpload = async () => {
  if (!bulkFile) {
    setMessage("Please upload a valid Excel file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", bulkFile);
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
    setMessage(response.data.message);
    setUsers((prev) => [...prev, ...response.data.users]);
    setFailedEntries(response.data.failedEntries); // Store failed entries
  } catch (error) {
    console.error("Error during bulk upload:", error);
    setMessage(error.response?.data?.error || "Failed to upload users.");
  }
};



  return (
    <div>
      <h2>Admin Dashboard</h2>

      {/* Add New User Section */}
      <h3>Add New User</h3>
      <input
        type="email"
        placeholder="Enter user email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="resident">Resident</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleAddUser}>Add User</button>

      {/* Bulk Upload Section */}
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

      {/* Display Failed Entries */}
      {failedEntries.length > 0 && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <h3>Failed Entries</h3>
          <ul>
            {failedEntries.map((entry, index) => (
              <li key={index} style={{ marginBottom: "10px" }}>
                <p>
                  <strong>{index + 1}.</strong> <br />
                  <strong>Name:</strong> {entry.row.Name} <br />
                  <strong>Email:</strong> {entry.row.Email} <br />
                  <strong>Phone Number:</strong> {entry.row["Phone Number (without +65 and spaces)"]} <br />
                  <strong>Error:</strong> {entry.error}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Users Section */}
      <h3>Search Users</h3>
      <input
        type="text"
        placeholder="Search by email"
        value={searchTerm}
        onChange={handleSearch}
      />

      {/* All Users List */}
      <h3>All Users</h3>
      {users.map((user) => (
        <div key={user.email} style={{ marginBottom: "10px" }}>
          <p>
            {user.email} - {user.phoneNumber || "N/A"} {user.suspended && "(Suspended)"}
          </p>
          <div>
            <label>Role:</label>
            <select
              value={editedUser?.email === user.email ? editedUser.role : user.role || ""}
              onChange={(e) =>
                setEditedUser({
                  ...user,
                  role: e.target.value,
                  phoneNumber: user.phoneNumber || "",
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
                })
              }
            />
          </div>
          <div>
            <button
              onClick={() => {
                setConfirmPopup(true);
                setPopupAction("save");
                setEditedUser(user);
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
            <button onClick={() => handleResetPassword(user.email)}>Reset Password</button>
          </div>
        </div>
      ))}

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
                  setEditedUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
    </div>
  );
};

export default AdminDashboard;
