import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Showtime from "../model/showtime.js";
import Booking from "../model/Booking.js";
import Combo from "../model/Combo.js";
import Cinema from "../model/Cinema.js";
import CinemaSystem from "../model/CinemaSystem.js";

// 🧠 Bộ nhớ tạm giữ ghế
const seatLockStore = new Map();

/* ============================================================
   🔒 HÀM LOCK GHẾ TRONG BỘ NHỚ
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

    // Tự mở khóa sau ttl giây
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

/* ============================================================
   📍 API: LẤY DANH SÁCH GHẾ + TRẠNG THÁI
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
      return { ...seat, locked: isLocked, sold: seat.status === "sold" };
    });

    res.status(200).json({
      seats,
      priceBySeatType: showtime.priceBySeatType || {
        regular: showtime.price,
        vip: Math.round(showtime.price * 1.4),
      },
    });
  } catch (error) {
    console.error("❌ getSeatsController:", error);
    res.status(500).json({ message: "Lỗi khi lấy ghế." });
  }
};

/* ============================================================
   📍 API: LOCK GHẾ
============================================================ */
export const lockSeatsController = async (req, res) => {
  try {
    const { showtimeId, seatIds } = req.body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0)
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

    res.status(200).json({ message: "Khóa ghế thành công", lockId });
  } catch (error) {
    console.error("❌ lockSeatsController:", error);
    res.status(500).json({ message: "Lỗi khi khóa ghế." });
  }
};

/* ============================================================
   📍 API: XÁC NHẬN ĐẶT VÉ (CÓ COMBO)
============================================================ */
export const confirmBookingController = async (req, res) => {
  try {
    const {
      showtimeId,
      movieTitle,
      moviePoster,
      seats,
      selectedCombos,
      combos, // fallback từ FE cũ
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

    // 🟣 Xử lý combo (FE gửi selectedCombos hoặc combos)
    let finalCombos = [];
    const comboSource = selectedCombos || combos;

    if (comboSource && typeof comboSource === "object") {
      for (const [code, qty] of Object.entries(comboSource)) {
        const comboDoc = await Combo.findOne({ code });
        if (comboDoc) {
          finalCombos.push({
            comboId: comboDoc._id,
            name: comboDoc.name,
            price: comboDoc.price,
            quantity: qty,
            totalPrice: comboDoc.price * qty,
          });
        }
      }
    } else if (Array.isArray(comboSource)) {
      finalCombos = comboSource;
    }

    // ✅ Kiểm tra ghế
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

    // ✅ Xóa khóa ghế
    for (const s of seats) {
      const key = `showtime:${showtimeId}:seat:${s.seatNumber}`;
      seatLockStore.delete(key);
    }

    // ✅ Mã vé
    const bookingCode = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ✅ Lưu Booking
    const newBooking = await Booking.create({
      userId,
      userEmail: req.user?.email || "unknown@example.com",
      showtimeId,
      movieTitle,
      moviePoster,
      cinemaInfo,
      showtimeInfo,
      seats,
      combos: finalCombos, // ✅ combo lưu ở đây
      total,
      paymentMethod,
      paymentStatus: "paid",
      bookingCode,
      isActive: true,
    });

    // ✅ Ghi lịch sử CinemaSystem & Cinema
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

    res.status(201).json({
      message: "Đặt vé thành công!",
      booking: newBooking,
    });
  } catch (error) {
    console.error("❌ confirmBookingController:", error);
    res.status(500).json({ message: "Lỗi khi xác nhận đặt vé." });
  }
};

/* ============================================================
   📍 API: LẤY LỊCH SỬ ĐẶT VÉ NGƯỜI DÙNG (KÈM COMBO)
============================================================ */
export const getUserBookings = async (req, res) => {
  try {
    const rawId = req.user?._id || req.user?.id || req.query.userId;
    if (!rawId) return res.status(401).json({ message: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "UserId không hợp lệ" });
    }

    const userId = new mongoose.Types.ObjectId(rawId);

    // 🧠 Lấy bookings không để lỗi ObjectId
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // 🧩 Duyệt thủ công để lấy thông tin combo nếu có comboId là ObjectId
    for (const booking of bookings) {
      if (Array.isArray(booking.combos)) {
        for (const combo of booking.combos) {
          // Nếu comboId là ObjectId thật thì populate
          if (mongoose.Types.ObjectId.isValid(combo.comboId)) {
            const comboDoc = await Combo.findById(combo.comboId).lean();
            if (comboDoc) {
              combo.name = comboDoc.name;
              combo.price = comboDoc.price;
            }
          }
        }
      }
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("❌ getUserBookings:", error);
    res.status(500).json({ message: "Lỗi khi tải lịch sử đặt vé." });
  }
};

/* ============================================================
   📍 API: GIẢI PHÓNG GHẾ
============================================================ */
export const releaseSeatsController = async (req, res) => {
  try {
    const { showtimeId, seatNumbers } = req.body;
    if (!showtimeId || !Array.isArray(seatNumbers) || seatNumbers.length === 0)
      return res.status(400).json({ message: "Thiếu thông tin ghế." });

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu." });

    showtime.seats.forEach((seat) => {
      if (seatNumbers.includes(seat.seatNumber)) seat.status = "available";
    });
    await showtime.save();

    res.status(200).json({ message: "Đã giải phóng ghế thành công" });
  } catch (error) {
    console.error("❌ releaseSeatsController:", error);
    res.status(500).json({ message: "Lỗi khi giải phóng ghế." });
  }
};
