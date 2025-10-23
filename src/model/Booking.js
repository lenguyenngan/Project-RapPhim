// model/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: false,
      default: "unknown@example.com",
    },
    showtimeId: {
      type: String,
      required: true,
    },
    movieTitle: {
      type: String,
      required: true,
    },
    moviePoster: {
      type: String,
      default: "/images/default-poster.jpg",
    },

    cinemaInfo: {
      type: {
        systemName: { type: String, required: false, default: "CGV Cinemas" },
        clusterName: {
          type: String,
          required: false,
          default: "Cụm rạp mặc định",
        },
        hallName: { type: String, required: false, default: "Phòng chiếu 1" },
      },
      required: false,
      default: {},
    },

    showtimeInfo: {
      date: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },

    seats: [
      {
        seatNumber: { type: String, required: true },
        type: { type: String, enum: ["regular", "vip"], required: true },
        price: { type: Number, required: true },
      },
    ],

    combos: [
      {
        comboId: { type: String },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number },
      },
    ],

    total: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["momo", "vnpay", "visa", "cod"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },

    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled", "expired"],
      default: "confirmed",
    },

    qrCode: {
      type: String,
    },

    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1 });
BookingSchema.index({ showtimeId: 1 });
BookingSchema.index({ bookingCode: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ createdAt: -1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
export default Booking;
