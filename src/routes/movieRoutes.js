import express from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";
import { listMovies, createMovie, getMovie, updateMovie, deleteMovie } from "../controller/movieController.js";

const router = express.Router();

router.get("/", listMovies);
router.get("/:id", getMovie);
router.post("/", verifyToken, requireAdmin, createMovie);
router.put("/:id", verifyToken, requireAdmin, updateMovie);
router.delete("/:id", verifyToken, requireAdmin, deleteMovie);

export default router;

