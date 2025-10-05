// src/index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";

// 🟢 Import middleware xác thực token & role
import {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
} from "./src/middleware/authMiddleware.js";

// 🟢 Import routes
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import movieRoutes from "./src/routes/movieRoutes.js";
import showtimeRoutes from "./src/routes/showtimeRoutes.js";
import cinemaSystemRoutes from "./src/routes/cinemaSystemRoutes.js";
import cinemaRoutes from "./src/routes/cinemaRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import comboRoutes from "./src/routes/comboRoutes.js";

// 🟢 Import seed SuperAdmin
import seedAdmin from "./src/seed/seedAdmin.js";

// ===== Cấu hình __dirname cho ES6 modules =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Cấu hình môi trường =====
dotenv.config();
const app = express();

// ===== Kết nối MongoDB =====
connectDB()
  .then(async () => {
    console.log("✅ MongoDB connected successfully");

    // 🧩 Gọi seed admin khi server start
    try {
      await seedAdmin();
      console.log("✅ Admin seeded successfully");
    } catch (err) {
      console.error("❌ Error seeding admin:", err);
    }
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
    process.exit(1); // Thoát nếu không kết nối được DB
  });

// ===== Cấu hình CORS =====
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173", // Vite dev server
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===== Middleware xử lý body =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== Static folder cho ảnh upload =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Debug request (chỉ trong development) =====
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`\n📥 ${req.method} ${req.url}`);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Query:", req.query);
    next();
  });
}

// ===== Route test & health check =====
app.get("/", (req, res) => {
  res.json({
    message: "🎬 Movie Booking API is running...",
    status: "success",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is healthy ✅",
    status: "success",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || "development",
  });
});

// ===== Gắn routes =====
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/cinema-systems", cinemaSystemRoutes);
app.use("/api/cinemas", cinemaRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes); // ⚠️ FIX: Đổi từ /api/booking → /api/bookings
app.use("/api/combos", comboRoutes);

// ===== Route mẫu có phân quyền =====
app.get("/api/admin/data", verifyToken, requireAdmin, (req, res) => {
  res.json({
    message: "Chỉ admin mới xem được",
    user: req.user,
  });
});

app.get("/api/superadmin/data", verifyToken, requireSuperAdmin, (req, res) => {
  res.json({
    message: "Chỉ superadmin mới xem được",
    user: req.user,
  });
});

// ===== Global error handler =====
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
      field: err.path,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    status: "error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===== 404 fallback =====
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.url} not found`,
    status: "fail",
  });
});

// ===== Khởi động server =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ===== Graceful shutdown =====
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, closing server gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// ===== Unhandled rejection handler =====
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
