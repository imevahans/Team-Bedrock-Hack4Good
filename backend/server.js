const path = require('path');
const express = require('express');
require('dotenv').config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API routes (e.g., auth and admin routes)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Catch-all route to serve React app for other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
