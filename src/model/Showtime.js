// models/Showtime.js
import mongoose from "mongoose";

const ShowtimeSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true },
    systemId: { type: String, required: true },
    clusterId: { type: String, required: true },
    hallId: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    price: { type: Number, required: true },
    priceBySeatType: {
      regular: Number,
      vip: Number,
    },
    date: { type: String, required: true },
    availableSeats: { type: Number, default: 100 },
    totalSeats: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Showtime", ShowtimeSchema);
