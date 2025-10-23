import mongoose from "mongoose";

const cinemaSystemSchema = new mongoose.Schema(
  {
    bookings: [
      {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: "Cinema" },
        movieTitle: String,
        total: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CinemaSystem = mongoose.model("CinemaSystem", cinemaSystemSchema);
export default CinemaSystem;
