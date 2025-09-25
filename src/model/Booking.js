import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    clusterId: { type: String, required: true },
    hallId: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    seats: { type: [String], required: true },
    pricePerSeat: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

bookingSchema.index({
  movieId: 1,
  date: 1,
  clusterId: 1,
  hallId: 1,
  startTime: 1,
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
