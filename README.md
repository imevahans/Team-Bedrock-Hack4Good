### **Updated README**

---

# **README: Muhammadiyah Welfare Home Minimart and Voucher System**

## **Project Overview**
This project is a web-based Minimart and Voucher System for Muhammadiyah Welfare Home (MWH). It enables:
- **Residents (Users):** Request products, earn vouchers, manage accounts, and participate in auctions.
- **Admins:** Manage users, approve voucher tasks and product requests, track inventory, and generate reports.

The system is designed to be secure, user-friendly, and scalable. It includes optional features like auctions to foster engagement among residents.

---

## **System Features**

### **For Residents**
- **Dashboard:** View voucher balances, transaction history, and available products.
- **Product Requests:** Easily request items or preorder out-of-stock products.
- **Secure Login:** Includes password reset functionality via mobile.

### **For Admins**
- **User Management:** Add, suspend, or reset user accounts.
- **Voucher Approvals:** Approve/reject voucher tasks with detailed tracking.
- **Inventory Tracking:** Maintain inventory with audit logs.
- **Reporting Tools:** Generate weekly and monthly summaries.
- **Auction System:** Residents bid on premium items using vouchers (optional).

---

## **Project Structure**

```plaintext
project-root/
├── backend/                   # Backend application
│   ├── node_modules/          # Backend dependencies
│   ├── .env                   # Backend environment variables
│   ├── app.js                 # Entry point for backend
│   ├── package.json           # Backend package metadata
│   ├── package-lock.json      # Backend lockfile
│   ├── database/              # Database configuration
│   │   └── neo4j.js           # Neo4j driver setup
│   ├── middlewares/           # Middleware logic
│   │   └── authMiddleware.js  # Authentication middleware
│   ├── routes/                # Backend routes
│   │   └── auth.js            # Authentication routes
│   ├── services/              # Service layer for backend logic
│   │   └── authService.js     # Authentication and user services
│   └── README.md              # Backend-specific documentation
│
├── frontend/                  # Frontend application
│   ├── node_modules/          # Frontend dependencies
│   ├── public/                # Static files
│   │   └── index.html         # HTML entry point
│   ├── src/                   # Frontend source code
│   │   ├── assets/            # Static assets (images, icons, etc.)
│   │   ├── components/        # Reusable components
│   │   │   ├── Admin/         # Admin-specific components
│   │   │   └── Residents/     # Resident-specific components
│   │   ├── context/           # Global context for state management
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Pages for routes
│   │   ├── services/          # Axios configuration for backend API calls
│   │   ├── styles/            # CSS styles
│   │   ├── App.jsx            # Root React component
│   │   ├── main.jsx           # React entry point
│   └── README.md              # Frontend-specific documentation
│
└── README.md                  # Project-level documentation
```

---

## **Getting Started**

### **1. Prerequisites**
1. **Node.js**: Ensure Node.js (v14 or later) is installed.
2. **Neo4j Database**:
   - Install and start a Neo4j instance.
   - Use the Neo4j Browser to ensure the database is running.

---

### **2. Backend Setup**
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file:
   ```plaintext
   NEO4J_URI=neo4j://localhost:7687
   NEO4J_USER=your_neo4j_username
   NEO4J_PASSWORD=your_neo4j_password
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```
4. Start the backend server:
   ```bash
   nodemon app.js
   ```

---

### **3. Frontend Setup**
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file:
   ```plaintext
   VITE_API_URL=http://localhost:3000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

### **4. Accessing the Application**
- **Frontend (React):** Open `http://localhost:5173` in your browser.
- **Backend (Node.js):** Ensure the backend is running on `http://localhost:3000`.

---

## **Usage Guide**

### **Residents**
1. Navigate to `http://localhost:5173`.
2. Log in using resident credentials.
3. Access the Resident Dashboard to:
   - View voucher balance and transaction history.
   - Request products or preorder out-of-stock items.

### **Admins**
1. Log in using admin credentials.
2. Access the Admin Dashboard to:
   - Manage users (add, suspend, reset passwords).
   - Track inventory and approve/reject tasks.
   - Generate reports.

---

## **Development Workflow**

### **Frontend Development**
- Modify frontend files in `frontend/src/`.
  - **Components:** Add or update reusable UI elements in `src/components/`.
  - **Pages:** Update route-specific components in `src/pages/`.

### **Backend Development**
- Modify backend files in `backend/`.
  - **Routes:** Add or update API routes in `backend/routes/`.
  - **Services:** Add or update business logic in `backend/services/`.

---

## **Commands**

### **Frontend**
- Install dependencies: `npm install`
- Start the development server: `npm run dev`

### **Backend**
- Install dependencies: `npm install`
- Start the server: `nodemon app.js`

---

## **How to See Changes**

### **Frontend Changes**
1. Update a frontend file (e.g., `src/pages/LoginPage.jsx`).
2. Save the file, and Vite’s hot reloading will reflect changes automatically.

### **Backend Changes**
1. Update a backend file (e.g., `routes/auth.js`).
2. Restart the backend server:
   ```bash
   nodemon app.js
   ```

---

## **Contributing**
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit and push your changes:
   ```bash
   git commit -m "Add feature-name"
   git push origin feature-name
   ```
4. Open a pull request.

---

## **Future Enhancements**
- Gamification of voucher earning.
- Mobile app integration.
- Advanced analytics for admin reports.

---

Let me know if you need further clarification or assistance! 🚀