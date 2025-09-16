import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../model/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: "admin@rapphim.com" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("123456", 10);

      await User.create({
        username: "admin",
        fullName: "Super Admin",
        email: "admin@rapphim.com",
        password: hashedPassword,
        phone: "0123456789",
        role: "superadmin",
      });

      console.log(" Superadmin created successfully");
    } else {
      console.log(" Superadmin already exists");
    }
  } catch (error) {
    console.error(" Seed admin error:", error.message);
  }
};

export default seedAdmin;
