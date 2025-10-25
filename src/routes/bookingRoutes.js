import express from "express";
import {
  getSeatsController,
  lockSeatsController,
  releaseSeatsController,
  confirmBookingController,
  getUserBookings,
} from "../controller/bookingController.js";

import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";
import Booking from "../model/Booking.js";

const router = express.Router();

// ===== PUBLIC ROUTES =====
// Lấy danh sách ghế (không cần đăng nhập)
router.get("/showtimes/:showtimeId/seats", getSeatsController);

// ===== USER ROUTES (Cần đăng nhập) =====
router.post("/lock", verifyToken, lockSeatsController);
router.post("/release", verifyToken, releaseSeatsController);
router.post("/confirm", verifyToken, confirmBookingController);
router.get("/user", verifyToken, getUserBookings);

// ===== ADMIN ROUTES =====
// 🆕 GET /api/bookings - Lấy tất cả bookings (chỉ admin)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter
    let filter = {};
    if (status && status !== "all") {
      filter.bookingStatus = status;
    }

    // Lấy bookings từ DB và populate user info
    const bookings = await Booking.find(filter)
      .populate("userId", "fullName email phone")
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Format dữ liệu trả về với thông tin rạp chính xác
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      bookingId: booking.bookingCode || booking._id.toString().slice(-8),

      // User info
      userInfo: {
        fullName: booking.userId?.fullName || "N/A",
        email: booking.userId?.email || booking.userEmail || "N/A",
        phone: booking.userId?.phone || "N/A",
      },

      // Movie info
      movieTitle: booking.movieTitle,
      moviePoster: booking.moviePoster,

      // ✅ QUAN TRỌNG: Cinema info - Lấy từ cinemaInfo thay vì hardcode
      systemName: booking.cinemaInfo?.systemName || "Hệ thống rạp",
      clusterName: booking.cinemaInfo?.clusterName || "Cụm rạp",
      hallName: booking.cinemaInfo?.hallName || "Phòng chiếu",

      // Showtime info
      date: booking.showtimeInfo?.date,
      startTime: booking.showtimeInfo?.startTime,
      endTime: booking.showtimeInfo?.endTime,

      // Booking details
      seats: booking.seats,
      combos: booking.combos,
      ticketPrice: booking.seats?.[0]?.price || 0,
      total: booking.total,

      // Status
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,

      // Timestamps
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    res.json({
      success: true,
      bookings: formattedBookings,
      total: formattedBookings.length,
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bookings",
      error: error.message,
    });
  }
});

// ==========================================
// ✅ GET /api/bookings/:id - Lấy chi tiết 1 booking
// ==========================================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "fullName email phone")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // ✅ Format dữ liệu với thông tin rạp chính xác
    const formattedBooking = {
      _id: booking._id,
      bookingId: booking.bookingCode || booking._id.toString().slice(-8),

      userInfo: {
        fullName: booking.userId?.fullName || "N/A",
        email: booking.userId?.email || booking.userEmail || "N/A",
        phone: booking.userId?.phone || "N/A",
      },

      movieTitle: booking.movieTitle,
      moviePoster: booking.moviePoster,

      // ✅ QUAN TRỌNG: Cinema info - Lấy từ cinemaInfo
      systemName: booking.cinemaInfo?.systemName || "Hệ thống rạp",
      clusterName: booking.cinemaInfo?.clusterName || "Cụm rạp",
      hallName: booking.cinemaInfo?.hallName || "Phòng chiếu",

      date: booking.showtimeInfo?.date,
      startTime: booking.showtimeInfo?.startTime,
      endTime: booking.showtimeInfo?.endTime,

      seats: booking.seats,
      combos: booking.combos,
      ticketPrice: booking.seats?.[0]?.price || 0,
      total: booking.total,

      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      qrCode: booking.qrCode,

      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };

    res.json({
      success: true,
      booking: formattedBooking,
    });
  } catch (error) {
    console.error("❌ Error fetching booking detail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết booking",
      error: error.message,
    });
  }
});

export default router;
