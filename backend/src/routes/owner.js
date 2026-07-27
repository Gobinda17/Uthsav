const express = require("express");
const mongoose = require("mongoose");
const { Venue, User, Booking } = require("../db/models");
const { serialize } = require("../utils/serialize");
const router = express.Router();

// GET /api/owner/venues?ownerId=...
// For the demo, if no ownerId is passed, returns all venues (no auth wired up yet).
router.get("/venues", async (req, res, next) => {
  try {
    const { ownerId } = req.query;
    if (ownerId && !mongoose.isValidObjectId(ownerId)) {
      return res.json([]);
    }
    const venues = await Venue.find(ownerId ? { owner_id: ownerId } : {}).lean();
    res.json(venues.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/owner/venues/:venueId/dashboard
// Bookings + earnings summary for a single venue.
router.get("/venues/:venueId/dashboard", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.venueId)) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = await Venue.findById(req.params.venueId).lean();
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const rawBookings = await Booking.find({ venue_id: req.params.venueId })
      .sort({ created_at: -1 })
      .lean();

    const customers = await User.find({ _id: { $in: rawBookings.map((b) => b.customer_id) } })
      .select("name phone")
      .lean();
    const customerById = new Map(customers.map((c) => [c._id.toString(), c]));

    const bookings = rawBookings.map((b) => {
      const customer = customerById.get(b.customer_id.toString());
      return { ...b, customerName: customer?.name, customerPhone: customer?.phone };
    });

    const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
    const settledEarnings = confirmed.reduce((sum, b) => sum + (b.venue_total - b.commission_amount), 0);

    res.json({
      venue: { id: venue._id.toString(), name: venue.name, verified: !!venue.verified, status: venue.status },
      counts: {
        pending: bookings.filter((b) => b.status === "PENDING").length,
        confirmed: confirmed.length,
        declined: bookings.filter((b) => b.status === "DECLINED").length,
      },
      settledEarnings,
      bookings: bookings.map((b) => ({
        id: b._id.toString(),
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
