import React from 'react';

function Login({ onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        Email:
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          className="w-full px-4 py-2 border rounded"
        />
      </label>
      <label className="block">
        Password:
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          required
          className="w-full px-4 py-2 border rounded"
        />
      </label>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
      >
        Login
      </button>
    </form>
  );
}

export default Login;
