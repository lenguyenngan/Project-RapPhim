import express from "express";
import {
  listShowtimes,
  createShowtimes,
  getShowtimeById, // import mới
} from "../controller/showtimeController.js";

const router = express.Router();

// GET /api/showtimes
router.get("/", listShowtimes);

// GET /api/showtimes/:id
router.get("/:id", getShowtimeById);

// POST /api/showtimes
router.post("/", createShowtimes);

export default router;
