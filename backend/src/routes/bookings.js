const express = require("express");
const mongoose = require("mongoose");
const { Venue, User, AvailabilitySlot, Booking, Payment } = require("../db/models");
const { serialize } = require("../utils/serialize");
const { requireAuth } = require("../middleware/auth");
const { normalizePhone } = require("../utils/phone");
const router = express.Router();

// POST /api/bookings
// body: { venueId, eventType, eventDate, guestCount, customer: { phone, name } }
// Creates the booking + a SUCCESS "TOKEN" payment. In production the payment
// would start as INITIATED and flip to SUCCESS via a Razorpay webhook — this
// simulates that webhook firing immediately so the demo flow completes end to end.
router.post("/", async (req, res, next) => {
  try {
    const { venueId, eventType, eventDate, guestCount, customer } = req.body;
    if (!venueId || !eventDate || !customer?.phone) {
      return res.status(400).json({ error: "venueId, eventDate and customer.phone are required" });
    }
    if (!mongoose.isValidObjectId(venueId)) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = await Venue.findById(venueId).lean();
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const slot = await AvailabilitySlot.findOne({ venue_id: venueId, date: eventDate }).lean();
    if (slot && !slot.available) {
      return res.status(409).json({ error: "That date is no longer available" });
    }

    // find-or-create the customer (stand-in for OTP auth in production)
    const customerPhone = normalizePhone(customer.phone);
    let user = await User.findOne({ phone: customerPhone }).lean();
    if (!user) {
      user = (
        await User.create({ phone: customerPhone, name: customer.name || "Guest", role: "CUSTOMER" })
      ).toObject();
    }

    // Writes below are sequential rather than a multi-doc transaction, since
    // a standalone mongod (typical for local dev) doesn't support them.
    const venueTotal = slot?.price_override ?? venue.base_price;
    const tokenAmount = Math.round((venueTotal * venue.token_percent) / 100);
    const commissionAmount = Math.round((venueTotal * venue.commission_percent) / 100);

    const booking = await Booking.create({
      venue_id: venueId,
      customer_id: user._id,
      event_type: eventType || venue.event_types[0],
      event_date: eventDate,
      guest_count: guestCount || venue.capacity_min,
      venue_total: venueTotal,
      token_amount: tokenAmount,
      commission_amount: commissionAmount,
      status: "PENDING",
    });

    const payment = await Payment.create({
      booking_id: booking._id,
      amount: tokenAmount,
      type: "TOKEN",
      status: "SUCCESS",
      razorpay_ref: `demo_${Date.now()}`,
    });

    // Lock the date once a booking is placed against it
    if (slot) {
      await AvailabilitySlot.updateOne({ venue_id: venueId, date: eventDate }, { available: false });
    } else {
      await AvailabilitySlot.create({ venue_id: venueId, date: eventDate, available: false });
    }

    res.status(201).json({
      ...serialize(booking.toObject()),
      payments: [serialize(payment.toObject())],
      venue: { id: venue._id.toString(), name: venue.name },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const venue = await Venue.findById(booking.venue_id).select("name area").lean();
    const payments = await Payment.find({ booking_id: booking._id }).lean();

    res.json({
      ...serialize(booking),
      venue: venue ? serialize(venue) : null,
      payments: payments.map(serialize),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id  { status: "CONFIRMED" | "DECLINED" }
// Used by the venue owner dashboard to respond to a request. Only the venue's
// own owner or an ADMIN may act on a booking.
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (req.user.role !== "ADMIN") {
      const venue = await Venue.findById(booking.venue_id).select("owner_id").lean();
      if (req.user.role !== "VENUE_OWNER" || !venue || venue.owner_id.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this booking" });
      }
    }

    booking.status = status;
    if (status === "CONFIRMED") booking.confirmed_at = new Date();
    await booking.save();

    // If declined, free up the date again
    if (status === "DECLINED") {
      await AvailabilitySlot.updateOne(
        { venue_id: booking.venue_id, date: booking.event_date },
        { available: true }
      );
    }

    res.json(serialize(booking.toObject()));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
