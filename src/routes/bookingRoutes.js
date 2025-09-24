import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createBooking, listBookings } from "../controller/bookingController.js";

const router = express.Router();

router.get("/", verifyToken, listBookings);
router.post("/", verifyToken, createBooking);

export default router;

