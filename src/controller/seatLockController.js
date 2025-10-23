// controllers/seatLockController.js
import SeatLock from "../model/SeatLock.js";
import mongoose from "mongoose";
import Showtime from "../model/showtime.js";
import Booking from "../model/Booking.js";
import Cinema from "../model/Cinema.js";
import CinemaSystem from "../model/CinemaSystem.js";

// ✅ Giữ ghế (lock seats)
export const lockSeats = async (req, res) => {
  try {
    const { showtimeId, seatNumbers, userId, userEmail } = req.body;

    if (!showtimeId || !seatNumbers?.length)
      return res
        .status(400)
        .json({ message: "Thiếu thông tin suất chiếu hoặc danh sách ghế." });

    if (!userId || !userEmail)
      return res.status(400).json({ message: "Thiếu thông tin người dùng." });

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu." });

    const seatData = Array.isArray(showtime.seatData) ? showtime.seatData : [];

    // Kiểm tra ghế đã bị chiếm hoặc bị lock
    const occupiedSeats = new Set(
      seatData
        .filter(
          (s) =>
            s &&
            seatNumbers.includes(s.seatNumber) &&
            (s.status === "occupied" || s.status === "sold")
        )
        .map((s) => s.seatNumber)
    );

    const activeLocks = await SeatLock.find({
      showtimeId,
      isActive: true,
      expiresAt: { $gt: new Date() },
      seatNumbers: { $in: seatNumbers },
    }).lean();

    const lockedSeats = new Set();
    for (const lock of activeLocks) {
      for (const sn of lock.seatNumbers) {
        if (seatNumbers.includes(sn)) lockedSeats.add(sn);
      }
    }

    const conflictingSeats = Array.from(
      new Set([...occupiedSeats, ...lockedSeats])
    );
    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        message: "Một số ghế đã được giữ hoặc đặt.",
        conflictingSeats,
      });
    }

    // Deactivate lock cũ của user (nếu có)
    await SeatLock.updateMany(
      { userId, showtimeId, isActive: true, expiresAt: { $lt: new Date() } },
      { $set: { isActive: false } }
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const seatLock = await SeatLock.create({
      showtimeId,
      seatNumbers,
      userId,
      userEmail,
      expiresAt,
      isActive: true,
    });

    res.json({
      success: true,
      lockId: seatLock._id,
      expiresAt,
      expiresIn: Math.floor((expiresAt - new Date()) / 1000),
      message: "Đã giữ ghế thành công.",
    });
  } catch (error) {
    console.error("❌ lockSeats error:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi giữ ghế.", error: error.message });
  }
};

// ✅ Lấy danh sách ghế bị giữ
export const getLockedSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    if (!showtimeId)
      return res.status(400).json({ message: "Thiếu showtimeId" });

    const lockedSeats = await SeatLock.find({
      showtimeId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).select("seatNumbers userId userEmail expiresAt");

    const allLockedSeats = lockedSeats.flatMap((lock) =>
      lock.seatNumbers.map((seatNumber) => ({
        seatNumber,
        lockedBy: lock.userId,
        lockedByEmail: lock.userEmail,
        expiresAt: lock.expiresAt,
      }))
    );

    res.json({ success: true, lockedSeats: allLockedSeats });
  } catch (error) {
    console.error("❌ getLockedSeats error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy ghế bị giữ." });
  }
};

// ✅ Hủy giữ ghế
export const unlockSeats = async (req, res) => {
  try {
    const { lockId, userId } = req.body;
    if (!lockId || !userId)
      return res.status(400).json({ message: "Thiếu thông tin." });

    const result = await SeatLock.updateOne(
      { _id: lockId, userId, isActive: true },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0)
      return res
        .status(404)
        .json({ message: "Không tìm thấy lock hoặc không có quyền unlock." });

    res.json({ success: true, message: "Đã hủy giữ ghế thành công." });
  } catch (error) {
    console.error("❌ unlockSeats error:", error);
    res.status(500).json({ message: "Lỗi server khi hủy giữ ghế." });
  }
};

// ✅ Xác nhận đặt vé (confirm booking)
export const confirmBooking = async (req, res) => {
  try {
    const { lockId, bookingData } = req.body;

    const authUserId = req.user?._id || req.user?.id || bookingData?.userId;
    const userId = authUserId ? String(authUserId) : undefined;
    const userObjectId =
      authUserId && mongoose.isValidObjectId(authUserId)
        ? new mongoose.Types.ObjectId(authUserId)
        : null;

    if (!lockId || !bookingData) {
      return res.status(400).json({ message: "Thiếu dữ liệu." });
    }

    const seatLock = await SeatLock.findById(lockId);
    if (!seatLock)
      return res.status(404).json({ message: "Không tìm thấy lock." });

    const showtime = await Showtime.findById(seatLock.showtimeId);
    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu." });

    // ✅ Cập nhật trạng thái ghế
    const seatsArr = Array.isArray(showtime.seatData)
      ? showtime.seatData
      : showtime.seats || [];

    for (let seat of seatsArr) {
      if (seatLock.seatNumbers.includes(seat.seatNumber)) {
        seat.status = "occupied";
      }
    }
    if (Array.isArray(showtime.seatData)) showtime.seatData = seatsArr;
    else showtime.seats = seatsArr;
    await showtime.save();

    // ✅ Hủy hiệu lực lock
    if (seatLock.isActive) {
      seatLock.isActive = false;
      await seatLock.save();
    }

    // ✅ Tạo mã booking
    const bookingCode = `BK${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    const seats = Array.isArray(bookingData.selectedSeats)
      ? bookingData.selectedSeats.map((s) => ({
          seatNumber: s.seatNumber || s,
          type: s.type || "regular",
          price: Number(s.price || 0),
        }))
      : [];

    const combosArr = Object.entries(bookingData.selectedCombos || {})
      .filter(([, q]) => q > 0)
      .map(([comboId, quantity]) => ({
        comboId,
        name: String(comboId),
        price: 0,
        quantity,
      }));

    const userEmail =
      req.user?.email || bookingData.userEmail || seatLock.userEmail;

    // ✅ Tạo booking mới
    const newBooking = await Booking.create({
      userId: userObjectId,
      userEmail,
      showtimeId: String(seatLock.showtimeId),
      movieTitle: bookingData.movieTitle,
      moviePoster: bookingData.moviePoster,
      cinemaInfo: {
        systemName: bookingData.systemName,
        clusterName: bookingData.clusterName,
        hallName: bookingData.hallName,
      },
      showtimeInfo: {
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      },
      seats,
      combos: combosArr,
      total: Number(bookingData.total || 0),
      paymentMethod: bookingData.paymentMethod || "momo",
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      bookingCode,
    });

    // ✅ Lưu thông tin vào Cinema và CinemaSystem
    const { systemName, clusterName } = bookingData;
    if (systemName) {
      await CinemaSystem.findOneAndUpdate(
        { name: systemName },
        { $push: { bookings: newBooking._id } },
        { upsert: true, new: true }
      );
    }
    if (clusterName) {
      await Cinema.findOneAndUpdate(
        { name: clusterName },
        { $push: { bookings: newBooking._id } },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      message: "Đặt vé thành công",
      bookingCode,
    });
  } catch (error) {
    console.error("❌ confirmBooking error:", error);
    res
      .status(500)
      .json({ message: error.message || "Lỗi khi xác nhận đặt vé." });
  }
};
