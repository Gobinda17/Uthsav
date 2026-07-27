const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/owner/venues?ownerId=...
// For the demo, if no ownerId is passed, returns all venues (no auth wired up yet).
router.get("/venues", (req, res, next) => {
  try {
    const { ownerId } = req.query;
    const venues = ownerId
      ? db.prepare(`SELECT * FROM venues WHERE owner_id = ?`).all(ownerId)
      : db.prepare(`SELECT * FROM venues`).all();
    res.json(venues);
  } catch (err) {
    next(err);
  }
});

// GET /api/owner/venues/:venueId/dashboard
// Bookings + earnings summary for a single venue.
router.get("/venues/:venueId/dashboard", (req, res, next) => {
  try {
    const venue = db.prepare(`SELECT * FROM venues WHERE id = ?`).get(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const bookings = db
      .prepare(`SELECT * FROM bookings WHERE venue_id = ? ORDER BY created_at DESC`)
      .all(req.params.venueId)
      .map((b) => {
        const customer = db.prepare(`SELECT name, phone FROM users WHERE id = ?`).get(b.customer_id);
        return { ...b, customerName: customer?.name, customerPhone: customer?.phone };
      });

    const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
    const settledEarnings = confirmed.reduce((sum, b) => sum + (b.venue_total - b.commission_amount), 0);

    res.json({
      venue: { id: venue.id, name: venue.name, verified: !!venue.verified, status: venue.status },
      counts: {
        pending: bookings.filter((b) => b.status === "PENDING").length,
        confirmed: confirmed.length,
        declined: bookings.filter((b) => b.status === "DECLINED").length,
      },
      settledEarnings,
      bookings: bookings.map((b) => ({
        id: b.id,
        customer: b.customerName,
        eventType: b.event_type,
        eventDate: b.event_date,
        guestCount: b.guest_count,
        venueTotal: b.venue_total,
        tokenAmount: b.token_amount,
        commissionAmount: b.commission_amount,
        status: b.status,
        createdAt: b.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
