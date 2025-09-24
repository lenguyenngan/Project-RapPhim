import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let memoryServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      // Fallback to in-memory MongoDB for local/dev environments
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log(" Using in-memory MongoDB instance");
    }
    await mongoose.connect(mongoUri);
    console.log(" MongoDB Connected");
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
