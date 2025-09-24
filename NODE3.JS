// server.js

const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// 🎟️ In-memory seat storage
// Each seat has: id, status ("available", "locked", "booked"), lockedBy, lockExpiry
let seats = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  status: "available",
  lockedBy: null,
  lockExpiry: null,
}));

// 🛠 Utility: Clear expired locks
function clearExpiredLocks() {
  const now = Date.now();
  seats.forEach((seat) => {
    if (seat.status === "locked" && seat.lockExpiry <= now) {
      seat.status = "available";
      seat.lockedBy = null;
      seat.lockExpiry = null;
    }
  });
}

// ✅ GET all seats (with status)
app.get("/seats", (req, res) => {
  clearExpiredLocks();
  res.json(seats);
});

// ✅ POST lock a seat
app.post("/lock/:id", (req, res) => {
  clearExpiredLocks();

  const seatId = parseInt(req.params.id);
  const { user } = req.body;

  const seat = seats.find((s) => s.id === seatId);
  if (!seat) {
    return res.status(404).json({ message: "Seat not found" });
  }

  if (seat.status === "booked") {
    return res.status(400).json({ message: "Seat already booked" });
  }

  if (seat.status === "locked") {
    return res.status(400).json({ message: "Seat is already locked" });
  }

  // Lock the seat for 1 minute
  seat.status = "locked";
  seat.lockedBy = user;
  seat.lockExpiry = Date.now() + 60 * 1000;

  res.json({ message: `Seat ${seatId} locked for ${user}`, seat });
});

// ✅ POST confirm a booking
app.post("/confirm/:id", (req, res) => {
  clearExpiredLocks();

  const seatId = parseInt(req.params.id);
  const { user } = req.body;

  const seat = seats.find((s) => s.id === seatId);
  if (!seat) {
    return res.status(404).json({ message: "Seat not found" });
  }

  if (seat.status === "booked") {
    return res.status(400).json({ message: "Seat already booked" });
  }

  if (seat.status !== "locked" || seat.lockedBy !== user) {
    return res
      .status(400)
      .json({ message: "You must lock this seat before confirming" });
  }

  seat.status = "booked";
  seat.lockedBy = user;
  seat.lockExpiry = null;

  res.json({ message: `Seat ${seatId} booked successfully by ${user}`, seat });
});

// ✅ Auto-clear expired locks every 10 seconds
setInterval(clearExpiredLocks, 10 * 1000);

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
