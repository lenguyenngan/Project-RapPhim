import mongoose from "mongoose";

const comboItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const comboSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    items: [comboItemSchema],
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Combo = mongoose.model("Combo", comboSchema);

export default Combo;

