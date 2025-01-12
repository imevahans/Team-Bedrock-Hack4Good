import React from 'react';
import Login from '../components/Login';

function LoginPage() {
  const handleLogin = (data) => {
    console.log('Login data:', data); // Replace with API call
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <Login onSubmit={handleLogin} />
      </div>
    </div>
  );
}

export default LoginPage;
