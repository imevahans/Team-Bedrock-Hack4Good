# **Team-Bedrock-Hack4Good**

This is a full-stack web application for [Hack4Good]. It includes both a React frontend powered by Vite and a Node.js/Express backend with Neo4j integration.

---

## **Getting Started**

Follow the steps below to set up and run the project.

### **1. Clone the Repository**
Clone the repository to your local machine:
```bash
git clone https://github.com/your-username/Team-Bedrock-Hack4Good.git
cd Team-Bedrock-Hack4Good
```

---

### **2. Frontend Setup**
Navigate to the `frontend` directory, install dependencies, and build the production-ready files:
```bash
cd frontend
npm install
npm run build
```

This generates the `dist/` folder for the frontend.

---

### **3. Backend Setup**
Navigate back to the root directory and set up the backend:
```bash
cd ..
npm install
```

Ensure you have a `.env` file in the root directory with the following variables configured for Neo4j:
```plaintext
NEO4J_URI=neo4j+s://<your-neo4j-instance-url>
NEO4J_USER=<your-username>
NEO4J_PASSWORD=<your-password>
```

Replace `<your-neo4j-instance-url>`, `<your-username>`, and `<your-password>` with your Neo4j credentials.

---

### **4. Start the Application**
Run both the frontend and backend concurrently:
```bash
npm run dev
```

- The **frontend** will run on: `http://localhost:5173`.
- The **backend** will run on: `http://localhost:3000`.

The frontend will automatically proxy API calls to the backend.

---

## **Project Structure**
```plaintext
Team-Bedrock-Hack4Good/
├── backend/                # Backend source files
│   ├── controllers/        # Controller logic
│   ├── routes/             # API routes
│   ├── config/             # Configuration files (e.g., Neo4j)
│   ├── middleware/         # Middleware for request processing
│   └── server.js           # Entry point for the backend
├── frontend/               # Frontend source files
│   ├── public/             # Public assets
│   ├── src/                # React components and pages
│   ├── vite.config.js      # Vite configuration
│   └── dist/               # Production build (generated)
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
```

---

## **Development Notes**
- Use `nodemon` to watch for backend changes during development.
- Use `Vite`'s hot module replacement (HMR) for instant frontend updates.

---

## **Common Commands**
| Command                   | Description                                          |
|---------------------------|------------------------------------------------------|
| `npm install`             | Install all dependencies (run in root and `frontend`)|
| `npm run build` (frontend)| Build the production-ready frontend                  |
| `npm run dev`             | Start both frontend and backend concurrently         |

---

## **Troubleshooting**
1. **Neo4j Connection Issues**:
   - Check the `.env` file for the correct `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD`.

2. **Port Conflicts**:
   - Ensure no other services are running on `3000` or `5173`.

3. **Dependencies**:
   - If you encounter errors, clean and reinstall dependencies:
     ```bash
     rm -rf node_modules package-lock.json
     npm install
     ```

---

Let me know if you'd like to add more details or troubleshoot further! 🚀