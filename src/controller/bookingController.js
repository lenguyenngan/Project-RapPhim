import mongoose from "mongoose";
import Booking from "../model/Booking.js";
import Showtime from "../model/Showtime.js";
import Combo from "../model/Combo.js";

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { showtimeId, seats, combos, contact } = req.body;
    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Seats are required" });
    }
    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) return res.status(404).json({ message: "Showtime not found" });

    // Prevent double booking: check overlap
    const reservedSet = new Set(showtime.seatsReserved || []);
    const conflict = seats.find((s) => reservedSet.has(s));
    if (conflict) {
      return res.status(409).json({ message: `Seat ${conflict} already reserved` });
    }

    // Compute total
    let totalAmount = showtime.basePrice * seats.length;
    const comboDocs = [];
    if (Array.isArray(combos)) {
      for (const item of combos) {
        const combo = await Combo.findById(item.combo).session(session);
        if (!combo || !combo.isActive) {
          await session.abortTransaction();
          return res.status(400).json({ message: "Invalid combo item" });
        }
        comboDocs.push({ combo: combo._id, quantity: item.quantity || 1 });
        totalAmount += combo.price * (item.quantity || 1);
      }
    }

    // Reserve seats and create booking atomically
    showtime.seatsReserved.push(...seats);
    await showtime.save({ session });

    const booking = await Booking.create([
      {
        user: req.user?.id,
        showtime: showtime._id,
        seats,
        combos: comboDocs,
        totalAmount,
        status: "confirmed",
        contact: contact || {}
      }
    ], { session });

    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({ booking: booking[0] });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ message: "Booking failed", error: e.message });
  }
};

export const listBookings = async (req, res) => {
  try {
    const filter = req.user?.role === "admin" || req.user?.role === "superadmin" ? {} : { user: req.user?.id };
    const bookings = await Booking.find(filter)
      .populate({ path: "showtime", populate: ["movie", "auditorium"] })
      .populate("combos.combo")
      .sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

