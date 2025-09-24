import express from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";
import { listShowtimes, createShowtime, getSeatsForShowtime } from "../controller/showtimeController.js";

const router = express.Router();

router.get("/", listShowtimes);
router.get("/:id/seats", getSeatsForShowtime);
router.post("/", verifyToken, requireAdmin, createShowtime);

export default router;

