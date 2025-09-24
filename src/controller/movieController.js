import Movie from "../model/Movie.js";

export const listMovies = async (_req, res) => {
  try {
    const movies = await Movie.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ movies });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    return res.status(201).json({ movie });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

export const getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    return res.json({ movie });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    return res.json({ movie });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    return res.json({ message: "Movie deactivated", movie });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

