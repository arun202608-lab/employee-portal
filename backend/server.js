import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import auditMiddleware from "./middleware/auditMiddleware.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import zohoRoutes from "./routes/zohoRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

app.use(auditMiddleware);

// Database
connectDB();

// Auth routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/zoho", zohoRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Employee Portal API is running",
  });
});
app.get("/api/test-route", (req, res) => {
  res.json({
    success: true,
    message: "API routes are working"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});