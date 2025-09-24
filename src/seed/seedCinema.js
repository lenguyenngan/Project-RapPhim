import Movie from "../model/Movie.js";
import Auditorium from "../model/Auditorium.js";
import Combo from "../model/Combo.js";
import Showtime from "../model/Showtime.js";

export default async function seedCinema() {
  // Movies
  const movieCount = await Movie.countDocuments();
  if (movieCount === 0) {
    await Movie.insertMany([
      { title: "Avengers: Endgame", description: "Marvel epic", durationMinutes: 181, genres: ["Action", "Sci-Fi"], rating: "PG-13" },
      { title: "Inside Out 2", description: "Animation", durationMinutes: 96, genres: ["Animation"], rating: "PG" }
    ]);
  }

  // Auditorium
  let auditorium = await Auditorium.findOne({ name: "Room 1" });
  if (!auditorium) {
    auditorium = await Auditorium.create({
      name: "Room 1",
      rows: 8,
      cols: 12,
      seatTypes: [
        { code: "STD", label: "Standard", priceMultiplier: 1 },
        { code: "VIP", label: "VIP", priceMultiplier: 1.2 }
      ]
    });
  }

  // Combos
  const comboCount = await Combo.countDocuments();
  if (comboCount === 0) {
    await Combo.insertMany([
      { name: "Combo 1", items: [{ name: "Popcorn", quantity: 1 }, { name: "Soda", quantity: 1 }], price: 60000 },
      { name: "Combo 2", items: [{ name: "Popcorn", quantity: 1 }, { name: "Soda", quantity: 2 }], price: 75000 }
    ]);
  }

  // Showtimes
  const anyShowtime = await Showtime.findOne();
  if (!anyShowtime) {
    const movie = await Movie.findOne();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
    await Showtime.create({ movie: movie._id, auditorium: auditorium._id, startTime: start, basePrice: 90000, seatsReserved: [] });
  }
}

