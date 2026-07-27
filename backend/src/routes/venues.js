const express = require("express");
const mongoose = require("mongoose");
const { Venue, User, AvailabilitySlot, Review } = require("../db/models");
const { serialize } = require("../utils/serialize");
const router = express.Router();

// GET /api/venues?type=Wedding&q=fancy&city=Guwahati
router.get("/", async (req, res, next) => {
  try {
    const { type, q, city } = req.query;

    const filter = { status: "LIVE" };
    if (city) filter.city = city;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { area: rx }];
    }
    if (type) filter.event_types = type;

    const venues = await Venue.find(filter).lean();
    const shaped = await Promise.all(venues.map((v) => shapeVenue(v)));
    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

// GET /api/venues/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = await Venue.findById(req.params.id).lean();
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const owner = await User.findById(venue.owner_id).select("name").lean();
    res.json(await shapeVenue(venue, true, owner));
  } catch (err) {
    next(err);
  }
});

// GET /api/venues/:id/availability
router.get("/:id/availability", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.json([]);
    }

    const slots = await AvailabilitySlot.find({ venue_id: req.params.id })
      .select("date available price_override")
      .sort({ date: 1 })
      .lean();
    res.json(slots.map((s) => ({ date: s.date, available: !!s.available, priceOverride: s.price_override ?? null })));
  } catch (err) {
    next(err);
  }
});

async function shapeVenue(v, detailed = false, owner = null) {
  const reviews = await Review.find({ venue_id: v._id }).select("rating").lean();
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.5; // demo fallback so cards look populated before real reviews exist

  const base = {
    id: v._id.toString(),
    name: v.name,
    area: v.area,
    city: v.city,
    capacity: [v.capacity_min, v.capacity_max],
    price: v.base_price,
    verified: !!v.verified,
    eventTypes: v.event_types,
    amenities: v.amenities,
    rating: Number(avgRating.toFixed(1)),
    reviewCount: reviews.length,
    tokenPercent: v.token_percent,
    threeDUrl: v.three_d_url ?? null,
  };

  if (detailed) {
    base.description = v.description;
    base.cancellationTier = v.cancellation_tier;
    base.commissionPercent = v.commission_percent;
    base.owner = owner ? serialize(owner) : null;
  }

  return base;
}

module.exports = router;
