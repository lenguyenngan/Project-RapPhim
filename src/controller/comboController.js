import Combo from "../model/Combo.js";

export const listCombos = async (_req, res) => {
  try {
    const combos = await Combo.find({ isActive: true }).sort({ price: 1 });
    return res.json({ combos });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createCombo = async (req, res) => {
  try {
    const combo = await Combo.create(req.body);
    return res.status(201).json({ combo });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

export const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!combo) return res.status(404).json({ message: "Combo not found" });
    return res.json({ combo });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

export const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!combo) return res.status(404).json({ message: "Combo not found" });
    return res.json({ message: "Combo deactivated", combo });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

