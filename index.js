import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./src/routes/authRoutes.js";
import seedAdmin from "./src/seed/seedAdmin.js";

dotenv.config();
const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log(" MongoDB Connected");

    await seedAdmin();
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
