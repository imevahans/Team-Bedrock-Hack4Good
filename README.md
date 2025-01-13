# README: Muhammadiyah Welfare Home Minimart and Voucher System

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
.
├── node_modules/             # Dependencies
├── public/                   # Static files
├── src/
│   ├── assets/               # Images, icons, etc.
│   ├── components/           # Reusable components
│   │   ├── Admin/            # Admin-specific components
│   │   │   ├── ManageUsers.jsx
│   │   │   ├── SuspendUserModal.jsx
│   │   │   ├── ResetPasswordModal.jsx
│   │   └── Residents/        # Resident-specific components
│   │       ├── Login.jsx
│   │       ├── PasswordReset.jsx
│   ├── context/              # Global context for state management
│   │   └── AuthContext.jsx
│   ├── pages/                # Main pages of the app
│   │   ├── AdminDashboard.jsx
│   │   ├── ResidentDashboard.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   ├── services/             # Backend integrations
│   │   ├── neo4j.js          # Neo4j database configuration
│   │   ├── authService.js    # Authentication and user-related services
│   ├── styles/               # CSS files
│   │   ├── app.css
│   │   ├── index.css
│   ├── App.jsx               # Root React component
│   ├── main.jsx              # Entry point for React
├── .gitignore                # Ignored files for Git
├── eslint.config.js          # Linting configuration
├── index.html                # HTML template
├── package-lock.json         # Lockfile for dependencies
├── package.json              # Project metadata and dependencies
├── readme.md                 # Project documentation
├── vite.config.js            # Vite configuration
```

---

## **Getting Started**

### **Prerequisites**
1. **Node.js:** Ensure Node.js (v14 or later) is installed.
2. **Neo4j Database:**
   - Install and start a Neo4j instance.
   - Configure the `.env` file with your database details.

### **Installation**
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up a `.env` file in the root directory:
   ```plaintext
   VITE_NEO4J_URI=neo4j://localhost:7687
   VITE_NEO4J_USER=your_neo4j_username
   VITE_NEO4J_PASSWORD=your_neo4j_password
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the app at `http://localhost:5173`.

---

## **Usage Guide**

### **Residents**
1. Navigate to the login page (`/`).
2. Log in with your email and password.
3. Access your dashboard to:
   - View voucher balance and transaction history.
   - Request or preorder items.
   - Reset your password if necessary (`/reset-password`).

### **Admins**
1. Log in and access the admin dashboard (`/admin-dashboard`).
2. Manage users:
   - Add, suspend, or reset user accounts.
3. Track inventory and approve/reject voucher tasks.
4. Generate reports for weekly or monthly summaries.

---

## **Development Phases**
1. **Prototype:**
   - Core features for residents and admins.
   - Basic dashboards, login, and voucher management.

2. **Enhanced Features:**
   - Inventory tracking and reporting tools.
   - Password reset and audit logs.

3. **Optional Features:**
   - Auction system for residents.
   - AI-powered product recommendations.

---

## **Contributing**
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push your branch and open a pull request.

---

## **Future Enhancements**
- Gamification of voucher earning.
- Mobile app integration.
- Advanced analytics for admin reports.

---

## **License**
This project is licensed under the [MIT License](LICENSE).

---

Feel free to reach out for further support or contributions!