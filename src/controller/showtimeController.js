import Showtime from "../model/Showtime.js";
import Movie from "../model/Movie.js";
import Auditorium from "../model/Auditorium.js";

export const listShowtimes = async (req, res) => {
  try {
    const { movieId, date } = req.query;
    const filter = {};
    if (movieId) filter.movie = movieId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.startTime = { $gte: start, $lte: end };
    }
    const showtimes = await Showtime.find(filter)
      .populate("movie")
      .populate("auditorium")
      .sort({ startTime: 1 });
    return res.json({ showtimes });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createShowtime = async (req, res) => {
  try {
    const { movie, auditorium, startTime, basePrice } = req.body;
    const existsMovie = await Movie.findById(movie);
    const existsAud = await Auditorium.findById(auditorium);
    if (!existsMovie || !existsAud) {
      return res.status(400).json({ message: "Invalid movie or auditorium" });
    }
    const showtime = await Showtime.create({ movie, auditorium, startTime, basePrice });
    return res.status(201).json({ showtime });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

export const getSeatsForShowtime = async (req, res) => {
  try {
    const st = await Showtime.findById(req.params.id).populate("auditorium");
    if (!st) return res.status(404).json({ message: "Showtime not found" });
    const { rows, cols } = st.auditorium;
    const reserved = new Set(st.seatsReserved || []);
    const seats = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const code = `${String.fromCharCode(64 + r)}${c}`;
        seats.push({ code, isReserved: reserved.has(code) });
      }
    }
    return res.json({ seats, rows, cols });
  } catch (e) {
    return res.status(400).json({ message: "Bad request", error: e.message });
  }
};

