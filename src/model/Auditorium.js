import mongoose from "mongoose";

const seatTypeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    priceMultiplier: { type: Number, default: 1 }
  },
  { _id: false }
);

const auditoriumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    rows: { type: Number, required: true },
    cols: { type: Number, required: true },
    seatTypes: [seatTypeSchema]
  },
  { timestamps: true }
);

const Auditorium = mongoose.model("Auditorium", auditoriumSchema);

export default Auditorium;

