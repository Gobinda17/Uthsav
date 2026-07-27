const express = require("express");
const mongoose = require("mongoose");
const { Venue, User, Booking } = require("../db/models");
const { serialize } = require("../utils/serialize");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

// GET /api/admin/venues — every venue, any status, with owner name attached.
router.get("/venues", async (req, res, next) => {
  try {
    const venues = await Venue.find({}).sort({ created_at: -1 }).lean();
    const owners = await User.find({ _id: { $in: venues.map((v) => v.owner_id) } })
      .select("name phone")
      .lean();
    const ownerById = new Map(owners.map((o) => [o._id.toString(), o]));

    res.json(
      venues.map((v) => ({
        ...serialize(v),
        ownerName: ownerById.get(v.owner_id.toString())?.name ?? null,
        ownerPhone: ownerById.get(v.owner_id.toString())?.phone ?? null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/venues/:id  { status?, verified? }
router.patch("/venues/:id", async (req, res, next) => {
  try {
    const { status, verified } = req.body;
    const validStatuses = ["DRAFT", "PENDING_REVIEW", "LIVE", "PAUSED", "DELISTED"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    if (status !== undefined) venue.status = status;
    if (verified !== undefined) venue.verified = !!verified;
    await venue.save();

    res.json(serialize(venue.toObject()));
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/bookings — every booking across every venue.
router.get("/bookings", async (req, res, next) => {
  try {
    const bookings = await Booking.find({}).sort({ created_at: -1 }).lean();

    const venues = await Venue.find({ _id: { $in: bookings.map((b) => b.venue_id) } })
      .select("name owner_id")
      .lean();
    const venueById = new Map(venues.map((v) => [v._id.toString(), v]));

    const owners = await User.find({ _id: { $in: venues.map((v) => v.owner_id) } })
      .select("name")
      .lean();
    const ownerById = new Map(owners.map((o) => [o._id.toString(), o]));

    const customers = await User.find({ _id: { $in: bookings.map((b) => b.customer_id) } })
      .select("name phone")
      .lean();
    const customerById = new Map(customers.map((c) => [c._id.toString(), c]));

    res.json(
      bookings.map((b) => {
        const venue = venueById.get(b.venue_id.toString());
        const owner = venue ? ownerById.get(venue.owner_id.toString()) : null;
        const customer = customerById.get(b.customer_id.toString());
        return {
          id: b._id.toString(),
          venueName: venue?.name ?? null,
          ownerName: owner?.name ?? null,
          customerName: customer?.name ?? null,
          customerPhone: customer?.phone ?? null,
          eventType: b.event_type,
          eventDate: b.event_date,
          guestCount: b.guest_count,
          venueTotal: b.venue_total,
          tokenAmount: b.token_amount,
          commissionAmount: b.commission_amount,
          status: b.status,
          createdAt: b.created_at,
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
