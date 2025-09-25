import express from "express";
import { listCombos, getComboDetail } from "../controller/comboController.js";

const router = express.Router();

router.get("/", listCombos);
router.get("/:comboId", getComboDetail);

export default router;


