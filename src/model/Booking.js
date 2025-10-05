import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: { type: String, required: true },
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    clusterId: { type: String },
    hallId: { type: String },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    seats: [
      {
        seatNumber: { type: String, required: true },
        seatType: {
          type: String,
          enum: ["regular", "vip"],
          default: "regular",
        },
        price: { type: Number, required: true },
      },
    ],
    combos: [
      {
        comboId: { type: mongoose.Schema.Types.ObjectId, ref: "Combo" },
        name: String,
        quantity: { type: Number, default: 1 },
        price: Number,
      },
    ],
    totalPrice: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "cash" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
