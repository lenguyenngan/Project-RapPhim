import Booking from "../model/Booking.js";

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id; // from verifyToken
    const {
      movieId,
      date,
      clusterId,
      hallId,
      startTime,
      endTime,
      seats,
      pricePerSeat,
    } = req.body || {};

    if (
      !userId ||
      !movieId ||
      !date ||
      !clusterId ||
      !hallId ||
      !startTime ||
      !endTime ||
      !Array.isArray(seats) ||
      seats.length === 0 ||
      !Number(pricePerSeat)
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu đặt vé" });
    }

    const totalPrice = Number(pricePerSeat) * seats.length;
    const booking = await Booking.create({
      userId,
      movieId,
      date,
      clusterId,
      hallId,
      startTime,
      endTime,
      seats,
      pricePerSeat: Number(pricePerSeat),
      totalPrice,
    });
    return res.status(201).json({ message: "Đặt vé thành công", booking });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /api/bookings/my
export const listMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
