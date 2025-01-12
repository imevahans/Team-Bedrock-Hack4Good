import React from 'react';
import ReactDOM from 'react-dom/client'; // Ensure correct ReactDOM import for React 18+
import './index.css'; // Import global styles (if any)
import App from './App'; // Import the App component

// Create the root and render the App
const root = ReactDOM.createRoot(document.getElementById('root')); // Matches <div id="root"></div> in index.html
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
