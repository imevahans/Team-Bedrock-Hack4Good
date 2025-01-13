import React, { useEffect, useState } from "react";
import api from "../services/api";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch all users
        const response = await api.get("/auth/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>

      {/* Display All Users */}
      <section>
        <h3>Registered Users</h3>
        <ul>
          {users.map((user) => (
            <li key={user.email}>
              {user.email} - {user.role}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
