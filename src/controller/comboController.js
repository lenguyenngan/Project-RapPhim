import {
  comboData,
  getActiveCombos,
  getComboById,
} from "../data/combos.js";

// GET /api/combos
export const listCombos = async (_req, res) => {
  try {
    const combos = getActiveCombos();
    return res.json({ combos });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// GET /api/combos/:comboId
export const getComboDetail = async (req, res) => {
  try {
    const { comboId } = req.params;
    const combo = getComboById(comboId);
    if (!combo) return res.status(404).json({ message: "Combo not found" });
    return res.json({ combo });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};


