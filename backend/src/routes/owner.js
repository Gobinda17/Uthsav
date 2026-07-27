const express = require("express");
const mongoose = require("mongoose");
const { Venue, User, Booking } = require("../db/models");
const { serialize } = require("../utils/serialize");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.use(requireAuth, requireRole("VENUE_OWNER", "ADMIN"));

// GET /api/owner/venues
// VENUE_OWNER sees only their own venues; ADMIN sees every venue.
router.get("/venues", async (req, res, next) => {
  try {
    const filter = req.user.role === "ADMIN" ? {} : { owner_id: req.user.id };
    const venues = await Venue.find(filter).lean();
    res.json(venues.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/owner/venues
// Owner lists a new venue. Always starts PENDING_REVIEW/unverified — an
// ADMIN has to approve it before it's bookable (mirrors venues.js's LIVE-only filter).
router.post("/venues", async (req, res, next) => {
  try {
    if (req.user.role !== "VENUE_OWNER") {
      return res.status(403).json({ error: "Only venue owners can list a venue" });
    }

    const {
      name, description, area, city, capacity_min, capacity_max,
      base_price, event_types, amenities, three_d_url, cancellation_tier,
    } = req.body;

    if (
      !name || !description || !area ||
      capacity_min === undefined || capacity_max === undefined || base_price === undefined ||
      !Array.isArray(event_types) || !event_types.length ||
      !Array.isArray(amenities) || !amenities.length
    ) {
      return res.status(400).json({
        error: "name, description, area, capacity_min, capacity_max, base_price, event_types and amenities are required",
      });
    }

    const venue = await Venue.create({
      owner_id: req.user.id,
      name, description, area,
      city: city || undefined,
      capacity_min, capacity_max, base_price,
      event_types, amenities,
      three_d_url: three_d_url || undefined,
      cancellation_tier: cancellation_tier || undefined,
      status: "PENDING_REVIEW",
      verified: false,
    });

    res.status(201).json(serialize(venue.toObject()));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/owner/venues/:id
// Owner edits their own listing's details. Status/verified stay admin-only (see admin.js).
router.patch("/venues/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    if (req.user.role !== "ADMIN" && venue.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to edit this venue" });
    }

    const editable = [
      "name", "description", "area", "city", "capacity_min", "capacity_max",
      "base_price", "event_types", "amenities", "three_d_url", "cancellation_tier",
      "token_percent", "commission_percent",
    ];
    for (const field of editable) {
      if (req.body[field] !== undefined) venue[field] = req.body[field];
    }
    await venue.save();

    res.json(serialize(venue.toObject()));
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
    if (req.user.role !== "ADMIN" && venue.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to view this venue" });
    }

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
