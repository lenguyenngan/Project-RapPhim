import mongoose from "mongoose";

const bookingComboSchema = new mongoose.Schema(
  {
    combo: { type: mongoose.Schema.Types.ObjectId, ref: "Combo", required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    seats: [{ type: String, required: true }],
    combos: [bookingComboSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "confirmed" },
    contact: {
      fullName: { type: String },
      phone: { type: String },
      email: { type: String }
    }
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

