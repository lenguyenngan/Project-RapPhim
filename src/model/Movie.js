import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, required: true },
    rating: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    genres: [{ type: String }],
    releaseDate: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;

