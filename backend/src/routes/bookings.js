const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const router = express.Router();

// POST /api/bookings
// body: { venueId, eventType, eventDate, guestCount, customer: { phone, name } }
// Creates the booking + a SUCCESS "TOKEN" payment. In production the payment
// would start as INITIATED and flip to SUCCESS via a Razorpay webhook — this
// simulates that webhook firing immediately so the demo flow completes end to end.
router.post("/", (req, res, next) => {
  try {
    const { venueId, eventType, eventDate, guestCount, customer } = req.body;
    if (!venueId || !eventDate || !customer?.phone) {
      return res.status(400).json({ error: "venueId, eventDate and customer.phone are required" });
    }

    const venue = db.prepare(`SELECT * FROM venues WHERE id = ?`).get(venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const slot = db
      .prepare(`SELECT * FROM availability_slots WHERE venue_id = ? AND date = ?`)
      .get(venueId, eventDate);
    if (slot && !slot.available) {
      return res.status(409).json({ error: "That date is no longer available" });
    }

    // find-or-create the customer (stand-in for OTP auth in production)
    let user = db.prepare(`SELECT * FROM users WHERE phone = ?`).get(customer.phone);
    if (!user) {
      const id = uuid();
      db.prepare(`INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, 'CUSTOMER')`).run(
        id, customer.phone, customer.name || "Guest"
      );
      user = { id, phone: customer.phone, name: customer.name || "Guest" };
    }

    const venueTotal = slot?.price_override ?? venue.base_price;
    const tokenAmount = Math.round((venueTotal * venue.token_percent) / 100);
    const commissionAmount = Math.round((venueTotal * venue.commission_percent) / 100);
    const bookingId = uuid();

    const insertBooking = db.transaction(() => {
      db.prepare(`
        INSERT INTO bookings
          (id, venue_id, customer_id, event_type, event_date, guest_count,
           venue_total, token_amount, commission_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `).run(
        bookingId, venueId, user.id,
        eventType || venue.event_types.split(",")[0],
        eventDate, guestCount || venue.capacity_min,
        venueTotal, tokenAmount, commissionAmount
      );

      db.prepare(`
        INSERT INTO payments (id, booking_id, amount, type, status, razorpay_ref)
        VALUES (?, ?, ?, 'TOKEN', 'SUCCESS', ?)
      `).run(uuid(), bookingId, tokenAmount, `demo_${Date.now()}`);

      // Lock the date once a booking is placed against it
      if (slot) {
        db.prepare(`UPDATE availability_slots SET available = 0 WHERE venue_id = ? AND date = ?`).run(venueId, eventDate);
      } else {
        db.prepare(`INSERT INTO availability_slots (id, venue_id, date, available) VALUES (?, ?, ?, 0)`).run(uuid(), venueId, eventDate);
      }
    });
    insertBooking();

    const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(bookingId);
    const payments = db.prepare(`SELECT * FROM payments WHERE booking_id = ?`).all(bookingId);

    res.status(201).json({ ...booking, payments, venue: { id: venue.id, name: venue.name } });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id
router.get("/:id", (req, res, next) => {
  try {
    const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    const venue = db.prepare(`SELECT id, name, area FROM venues WHERE id = ?`).get(booking.venue_id);
    const payments = db.prepare(`SELECT * FROM payments WHERE booking_id = ?`).all(booking.id);
    res.json({ ...booking, venue, payments });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id  { status: "CONFIRMED" | "DECLINED" }
// Used by the venue owner dashboard to respond to a request.
router.patch("/:id", (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const confirmedAt = status === "CONFIRMED" ? new Date().toISOString() : booking.confirmed_at;
    db.prepare(`UPDATE bookings SET status = ?, confirmed_at = ? WHERE id = ?`).run(status, confirmedAt, booking.id);

    // If declined, free up the date again
    if (status === "DECLINED") {
      db.prepare(`UPDATE availability_slots SET available = 1 WHERE venue_id = ? AND date = ?`).run(
        booking.venue_id, booking.event_date
      );
    }

    const updated = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(booking.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
