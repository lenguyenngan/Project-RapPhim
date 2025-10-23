import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Showtime from "../model/showtime.js";
import Booking from "../model/Booking.js";
import Combo from "../model/Combo.js";
import Cinema from "../model/Cinema.js";
import CinemaSystem from "../model/CinemaSystem.js";

const seatLockStore = new Map();

/* ============================================================
   🔒 MOCK SEAT LOCK SYSTEM (giữ ghế tạm thời trong bộ nhớ)
============================================================ */
export const lockSeats = async ({ showtimeId, seatIds, lockId, ttl = 600 }) => {
  const locked = [];

  for (const seatId of seatIds) {
    const key = `showtime:${showtimeId}:seat:${seatId}`;

    if (seatLockStore.has(key)) {
      for (const k of locked) seatLockStore.delete(k);
      return { success: false, message: `Ghế ${seatId} đã bị khóa.` };
    }

    seatLockStore.set(key, lockId);
    locked.push(key);

    // Tự động mở khóa sau TTL (mặc định 10 phút)
    setTimeout(() => {
      if (seatLockStore.get(key) === lockId) seatLockStore.delete(key);
    }, ttl * 1000);
  }

  return { success: true, lockId, expiresIn: ttl };
};

export const releaseSeats = async ({ showtimeId, seatIds, lockId }) => {
  for (const seatId of seatIds) {
    const key = `showtime:${showtimeId}:seat:${seatId}`;
    if (seatLockStore.get(key) === lockId) seatLockStore.delete(key);
  }
};

export const isSeatLocked = async ({ showtimeId, seatId }) => {
  return seatLockStore.get(`showtime:${showtimeId}:seat:${seatId}`) || null;
};

/* ============================================================
   📍 GET SEATS (hiển thị trạng thái ghế)
============================================================ */
export const getSeatsController = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const showtime = await Showtime.findById(showtimeId).lean();

    if (!showtime)
      return res.status(404).json({ message: "Suất chiếu không tồn tại." });

    const seats = showtime.seats.map((seat) => {
      const isLocked = seatLockStore.has(
        `showtime:${showtimeId}:seat:${seat.seatNumber}`
      );
      return {
        ...seat,
        locked: isLocked,
        sold: seat.status === "sold",
      };
    });

    res.status(200).json({
      seats,
      priceBySeatType: showtime.priceBySeatType || {
        regular: showtime.price,
        vip: Math.round(showtime.price * 1.4),
      },
    });
  } catch (error) {
    console.error("❌ getSeatsController error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách ghế.", error: error.message });
  }
};

/* ============================================================
   📍 LOCK SEATS
============================================================ */
export const lockSeatsController = async (req, res) => {
  try {
    const { showtimeId, seatIds } = req.body;

    if (!showtimeId || !Array.isArray(seatIds) || !seatIds.length)
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });

    const showtime = await Showtime.findById(showtimeId).lean();
    if (!showtime)
      return res.status(404).json({ message: "Suất chiếu không tồn tại." });

    for (const sId of seatIds) {
      const seat = showtime.seats.find((s) => s.seatNumber === sId);
      if (!seat)
        return res.status(400).json({ message: `Ghế ${sId} không tồn tại.` });
      if (seat.status === "sold")
        return res.status(409).json({ message: `Ghế ${sId} đã bán.` });
    }

    const lockId = uuidv4();
    const result = await lockSeats({ showtimeId, seatIds, lockId, ttl: 600 });

    if (!result.success)
      return res.status(409).json({ message: result.message });

    res.status(200).json({ message: "Khóa ghế thành công.", lockId });
  } catch (error) {
    console.error("❌ lockSeatsController error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi khóa ghế.", error: error.message });
  }
};

/* ============================================================
   📍 CONFIRM BOOKING (cập nhật ghế đã bán + ẩn khi reload)
============================================================ */
export const confirmBookingController = async (req, res) => {
  try {
    const {
      showtimeId,
      movieTitle,
      moviePoster,
      seats,
      combos,
      total,
      paymentMethod,
      cinemaInfo,
      showtimeInfo,
    } = req.body;

    const userId = req.user?.id || req.body.userId;
    if (!userId) return res.status(400).json({ message: "Thiếu userId." });

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime)
      return res.status(404).json({ message: "Suất chiếu không tồn tại." });

    // 🔒 Kiểm tra ghế
    for (const s of seats) {
      const seat = showtime.seats.find((x) => x.seatNumber === s.seatNumber);
      if (!seat)
        return res
          .status(400)
          .json({ message: `Ghế ${s.seatNumber} không tồn tại.` });
      if (seat.status === "sold")
        return res
          .status(400)
          .json({ message: `Ghế ${s.seatNumber} đã được bán.` });
    }

    // ✅ Cập nhật trạng thái ghế
    showtime.seats = showtime.seats.map((seat) => {
      if (seats.some((s) => s.seatNumber === seat.seatNumber))
        seat.status = "sold";
      return seat;
    });

    showtime.availableSeats = Math.max(
      0,
      showtime.availableSeats - seats.length
    );
    await showtime.save();

    // ✅ Hủy khóa ghế
    for (const s of seats) {
      const key = `showtime:${showtimeId}:seat:${s.seatNumber}`;
      seatLockStore.delete(key);
    }

    // ✅ Tạo mã booking
    const bookingCode = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ✅ Lưu booking
    const newBooking = await Booking.create({
      userId,
      userEmail: req.user?.email || "unknown@example.com",
      showtimeId,
      movieTitle,
      moviePoster,
      cinemaInfo,
      showtimeInfo,
      seats,
      combos,
      total,
      paymentMethod,
      paymentStatus: "paid",
      bookingCode,
      isActive: true,
    });

    // ✅ Ghi lịch sử vào Cinema & CinemaSystem
    const { systemName, clusterName } = cinemaInfo || {};
    if (systemName && clusterName) {
      const system = await CinemaSystem.findOneAndUpdate(
        { name: systemName },
        {
          $push: {
            bookingHistory: {
              userId,
              bookingId: newBooking._id,
              movieTitle,
              date: new Date(),
              clusterName,
            },
          },
        },
        { new: true, upsert: true }
      );

      await Cinema.findOneAndUpdate(
        { name: clusterName, systemId: system._id },
        {
          $push: {
            bookingHistory: {
              userId,
              bookingId: newBooking._id,
              movieTitle,
              date: new Date(),
            },
          },
        },
        { new: true, upsert: true }
      );
    }

    res
      .status(201)
      .json({ message: "Đặt vé thành công!", booking: newBooking });
  } catch (error) {
    console.error("❌ confirmBookingController error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi xác nhận đặt vé.", error: error.message });
  }
};

/* ============================================================
   📍 GET USER BOOKINGS
============================================================ */
export const getUserBookings = async (req, res) => {
  try {
    const rawId = req.user?._id || req.user?.id;
    if (!rawId) return res.status(401).json({ message: "Unauthorized" });

    const userId = new mongoose.Types.ObjectId(rawId);
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedBookings = bookings.map((b) => ({
      id: b._id,
      movieTitle: b.movieTitle,
      moviePoster: b.moviePoster,
      seats: b.seats?.map((s) => s.seatNumber) || [],
      total: b.total,
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      status:
        b.paymentStatus === "paid"
          ? "Đã xác nhận"
          : b.paymentStatus === "pending"
          ? "Chờ xử lý"
          : "Đã hủy",
      bookingCode: b.bookingCode,
      date: new Date(b.createdAt).toLocaleString("vi-VN"),
      cinema:
        b.cinemaInfo?.clusterName || b.cinemaInfo?.systemName || "Không rõ rạp",
      showtime:
        b.showtimeInfo?.startTime && b.showtimeInfo?.date
          ? `${b.showtimeInfo.date} - ${b.showtimeInfo.startTime}`
          : "Không rõ",
      combos: b.combos?.length ? b.combos : [], // ✅ Trả về mảng gốc combo
    }));

    res.status(200).json({ bookings: formattedBookings });
  } catch (error) {
    console.error("❌ getUserBookings error:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tải lịch sử đặt vé.", error: error.message });
  }
};

/* ============================================================
   📍 RELEASE SEATS
============================================================ */
// ✅ Giải phóng ghế khi người dùng huỷ hoặc timeout
export const releaseSeatsController = async (req, res) => {
  try {
    const { showtimeId, seatNumbers } = req.body;

    if (!showtimeId || !seatNumbers || seatNumbers.length === 0) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin để giải phóng ghế" });
    }

    const showtime = await Showtime.findOne({ _id: showtimeId });
    if (!showtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    }

    // Đổi trạng thái ghế về available
    showtime.seats.forEach((seat) => {
      if (seatNumbers.includes(seat.seatNumber)) {
        seat.status = "available";
      }
    });

    await showtime.save();

    return res.status(200).json({ message: "Đã giải phóng ghế thành công" });
  } catch (error) {
    console.error("Lỗi releaseSeats:", error);
    return res.status(500).json({ message: "Lỗi khi giải phóng ghế" });
  }
};
