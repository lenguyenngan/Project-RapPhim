import express from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";
import { listCombos, createCombo, updateCombo, deleteCombo } from "../controller/comboController.js";

const router = express.Router();

router.get("/", listCombos);
router.post("/", verifyToken, requireAdmin, createCombo);
router.put("/:id", verifyToken, requireAdmin, updateCombo);
router.delete("/:id", verifyToken, requireAdmin, deleteCombo);

export default router;

