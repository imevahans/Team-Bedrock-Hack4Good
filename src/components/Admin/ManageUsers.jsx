import React, { useState } from "react";
import { getUsers, suspendUser, resetPassword } from "../../services/authService";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const result = await getUsers();
    setUsers(result);
  };

  const handleSuspend = async (userId) => {
    await suspendUser(userId);
    fetchUsers(); // Refresh user list
  };

  const handleResetPassword = async (userId) => {
    await resetPassword(userId);
    fetchUsers(); // Refresh user list
  };

  return (
    <div>
      <button onClick={fetchUsers}>Fetch Users</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.email}
            <button onClick={() => handleSuspend(user.id)}>Suspend</button>
            <button onClick={() => handleResetPassword(user.id)}>Reset Password</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageUsers;
