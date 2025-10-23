import mongoose from "mongoose";

const cinemaSchema = new mongoose.Schema(
  {
    bookings: [
      {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        movieTitle: String,
        total: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    systemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CinemaSystem",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Cinema = mongoose.model("Cinema", cinemaSchema);
export default Cinema;
