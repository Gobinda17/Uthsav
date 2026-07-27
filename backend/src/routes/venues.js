const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/venues?type=Wedding&q=fancy&city=Guwahati
router.get("/", (req, res, next) => {
  try {
    const { type, q, city } = req.query;

    let sql = `SELECT * FROM venues WHERE status = 'LIVE'`;
    const params = [];

    if (city) {
      sql += ` AND city = ?`;
      params.push(city);
    }
    if (q) {
      sql += ` AND (name LIKE ? OR area LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    let venues = db.prepare(sql).all(...params);

    if (type) {
      venues = venues.filter((v) => v.event_types.split(",").includes(type));
    }

    res.json(venues.map((v) => shapeVenue(v)));
  } catch (err) {
    next(err);
  }
});

// GET /api/venues/:id
router.get("/:id", (req, res, next) => {
  try {
    const venue = db.prepare(`SELECT * FROM venues WHERE id = ?`).get(req.params.id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const owner = db.prepare(`SELECT id, name FROM users WHERE id = ?`).get(venue.owner_id);
    res.json(shapeVenue(venue, true, owner));
  } catch (err) {
    next(err);
  }
});

// GET /api/venues/:id/availability
router.get("/:id/availability", (req, res, next) => {
  try {
    const slots = db
      .prepare(`SELECT date, available, price_override FROM availability_slots WHERE venue_id = ? ORDER BY date ASC`)
      .all(req.params.id);
    res.json(slots.map((s) => ({ date: s.date, available: !!s.available, priceOverride: s.price_override })));
  } catch (err) {
    next(err);
  }
});

function shapeVenue(v, detailed = false, owner = null) {
  const reviews = db.prepare(`SELECT rating FROM reviews WHERE venue_id = ?`).all(v.id);
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.5; // demo fallback so cards look populated before real reviews exist

  const base = {
    id: v.id,
    name: v.name,
    area: v.area,
    city: v.city,
    capacity: [v.capacity_min, v.capacity_max],
    price: v.base_price,
    verified: !!v.verified,
    eventTypes: v.event_types.split(","),
    amenities: v.amenities.split(","),
    rating: Number(avgRating.toFixed(1)),
    reviewCount: reviews.length,
    tokenPercent: v.token_percent,
    threeDUrl: v.three_d_url,
  };

  if (detailed) {
    base.description = v.description;
    base.cancellationTier = v.cancellation_tier;
    base.commissionPercent = v.commission_percent;
    base.owner = owner ? { id: owner.id, name: owner.name } : null;
  }

  return base;
}

module.exports = router;
