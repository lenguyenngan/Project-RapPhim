import mongoose from "mongoose";

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    auditorium: { type: mongoose.Schema.Types.ObjectId, ref: "Auditorium", required: true },
    startTime: { type: Date, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    seatsReserved: [{ type: String }]
  },
  { timestamps: true }
);

showtimeSchema.index({ movie: 1, auditorium: 1, startTime: 1 }, { unique: true });

const Showtime = mongoose.model("Showtime", showtimeSchema);

export default Showtime;

