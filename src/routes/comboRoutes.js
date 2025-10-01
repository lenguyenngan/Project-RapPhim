import express from "express";
import {
  listCombos,
  getComboDetail,
  createCombo,
} from "../controller/comboController.js";

const router = express.Router();

router.get("/", listCombos);
router.get("/:comboId", getComboDetail);

// 👉 Route thêm combo mới (chỉ admin dùng)
router.post("/", createCombo);

export default router;
