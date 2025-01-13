import React, { useState } from 'react';

const AdminPage = () => {
  const [email, setEmail] = useState('');
  const [action, setAction] = useState('');

  const handleManageUser = async () => {
    const response = await fetch('/admin/manage-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, action }),
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
    } else {
      alert(data.error);
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <input type="email" placeholder="User Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select value={action} onChange={(e) => setAction(e.target.value)}>
        <option value="">Select Action</option>
        <option value="add">Add User</option>
        <option value="suspend">Suspend User</option>
        <option value="reset">Reset Password</option>
      </select>
      <button onClick={handleManageUser}>Submit</button>
    </div>
  );
};

export default AdminPage;
