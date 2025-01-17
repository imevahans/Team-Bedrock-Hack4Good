# **Team Bedrock Web-based Minimart and Voucher System**

This project is a **Minimart and Voucher System** designed for **Muhammadiyah Welfare Home** for Hack For Good 2025 hackathon. 

The application consists of two parts:

- **Frontend**: A React application built with Vite.
- **Backend**: A Node.js/Express backend with JWT authentication, Twilio integration, and integration with Neo4j Graphical Database.

## **Table of Contents**
- [Installation](#installation)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Environment Configuration](#environment-configuration)
  - [Frontend .env](#frontend-env)
  - [Backend .env](#backend-env)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Features](#features)
  - [Special Features](#special-features)
- [Pitch Deck](#pitch-deck)
- [Demo Video](#demo-video)
- [Contributors](#contributors)

---

## **Installation**

### **Frontend Setup**

1. Clone the repository:
   ```bash
   git clone https://github.com/ItsPeeko/Team-Bedrock-Hack4Good.git
   cd your-repository
   ```

2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the `frontend` folder with the following content:
   ```plaintext
   JWT_SECRET="your-jwt-secret"
   VITE_API_URL=http://localhost:3000/api
   ```

5. Run the frontend application:
   ```bash
   npm run dev
   ```

6. Visit the frontend at `http://localhost:5173`.

---

### **Backend Setup**

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` folder with the following content:
   ```plaintext
   NEO4J_URI="neo4j+s://your-neo4j-uri"
   NEO4J_USER="neo4j"
   NEO4J_PASSWORD="your-neo4j-password"
   JWT_SECRET="your-jwt-secret"
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_SERVICE_SID=your-twilio-service-sid
   SESSION_SECRET="your-session-secret"
   NODE_ENV="dev"
   FRONTEND_URL=http://localhost:5173
   EMAIL_USER=your-email-user
   EMAIL_PASS=your-email-pass
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

4. Run the backend application:
   ```bash
   nodemon app.js
   ```

5. The backend should now be running at `http://localhost:3000`.

---

## **Environment Configuration**

### **Frontend .env**
The frontend `.env` file contains important environment variables that connect your frontend to the backend and the database. Example:

```plaintext
JWT_SECRET="your-jwt-secret"
VITE_API_URL=http://localhost:3000/api
```

### **Backend .env**
The backend `.env` file contains keys for database configuration, external services like Twilio, Google OAuth, and email service settings. Example:

```plaintext
NEO4J_URI="neo4j+s://your-neo4j-uri"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="your-neo4j-password"
JWT_SECRET="your-jwt-secret"
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_SERVICE_SID=your-twilio-service-sid
SESSION_SECRET="your-session-secret"
NODE_ENV="dev"
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-pass
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## **Running the Application**

Once you've set up each `.env` file in both "/backend" and "/frontend" respectively, and installed the dependencies, you can run both the frontend and backend applications locally.

### **Frontend**:
```bash
cd frontend
npm run dev
```
This will run the frontend at `http://localhost:5173`.

### **Backend**:
```bash
cd backend
nodemon app.js
```
This will run the backend at `http://localhost:3000`.

---

## **Creating the First Admin Account**

To create the first admin account, go to `http://localhost:5173/createadmin` and use the following details:
- **Email**: admin@a.com
- **Password**: password

This will allow you to start adding other users, as our app only allows **admins** to add users to prevent non-residents from gaining access to the system.

After that, please proceed to login at `http://localhost:5173/`.

---

## **Troubleshooting**

- **Backend not connecting to Neo4j**: Ensure the `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` are correctly set in the backend `.env`.
- **CORS Issues**: If you're running the frontend and backend on different domains, ensure CORS is properly set up in the backend. Example:
  ```javascript
  const cors = require('cors');
  app.use(cors());
  ```
- **Environment variables not loaded**: Double-check the `.env` files for syntax issues. Make sure you've restarted both frontend and backend after setting the environment variables.

---

## **Features**

### **Special Features**

- **Salt Encryption**: Passwords are encrypted using salt, ensuring data is securely stored.
- **Fast Relationship Mapping**: Neo4j is used to efficiently map relationships between data points, which ensures faster queries and data retrieval.
- **React Frontend**: React and Vite were chosen for their speed, with fast client-side rendering and efficient server-side processing.
- **Image Upload**: Residents can upload images as part of their voucher tasks for transparency and accountability.
- **Secure Password Reset**: Allows both email and mobile phone OTP for secure password resets.
- **No Password Exposure**: Passwords are never sent through email or mobile phone, ensuring they remain secure and are not vulnerable to leakage.
- **OTP for Invitation**: Even the invitation process requires an OTP to prevent unauthorized access.
- **Admin Controls**: Only admins can add users, ensuring that only legitimate residents can log in. Admins can add users either one by one or in bulk for ease of use.

---

## **Pitch Deck**
You can view the pitch deck for the project here:  
[**Pitch Deck**](https://docs.google.com/presentation/d/1HR37_GAUfmAjE2TfHsGruDAovHrvgnZ1ZBYbeRBM5EM/edit?usp=sharing)

---

## **Demo Video**
Watch the demo video of the project on YouTube:  
[**Demo Video**](https://youtu.be/L0EQNueS9L4)

---

### **Contributors**:
- [imevahans](https://github.com/imevahans)
- [ItsPeeko](https://github.com/ItsPeeko)
- [calebcjl](https://github.com/calebcjl)