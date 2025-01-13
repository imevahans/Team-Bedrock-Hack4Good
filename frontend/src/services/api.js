import axios from "axios";

// Create an Axios instance with default settings
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api", // Backend API base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Retrieve token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response, // Return the response if successful
  (error) => {
    const originalRequest = error.config;

    // Handle unauthorized errors (401) differently for login vs. other requests
    if (error.response?.status === 401) {
      console.error("Unauthorized error detected:", originalRequest.url);

      // If the request is NOT the login request, handle logout
      if (originalRequest.url !== "/auth/login") {
        console.warn("Unauthorized: Logging out...");
        localStorage.removeItem("token"); // Clear token on unauthorized error
        window.location.href = "/"; // Redirect to login page
      }
    }

    return Promise.reject(error);
  }
);

// Export API instance for use throughout the app
export default api;
