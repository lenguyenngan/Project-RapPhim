import express from "express";
import {
  listShowtimes,
  createShowtimes,
} from "../controller/showtimeController.js";

const router = express.Router();

// GET /api/showtimes
router.get("/", listShowtimes);

// POST /api/showtimes
router.post("/", createShowtimes);

export default router;
