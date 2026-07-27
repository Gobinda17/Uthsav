const { Schema, model } = require("mongoose");

const venueSchema = new Schema({
  owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true, default: "Guwahati" },
  capacity_min: { type: Number, required: true },
  capacity_max: { type: Number, required: true },
  base_price: { type: Number, required: true }, // INR
  verified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["DRAFT", "PENDING_REVIEW", "LIVE", "PAUSED", "DELISTED"],
    default: "PENDING_REVIEW",
  },
  event_types: { type: [String], required: true },
  amenities: { type: [String], required: true },
  three_d_url: { type: String },
  cancellation_tier: {
    type: String,
    enum: ["STANDARD", "STRICT", "FLEXIBLE"],
    default: "STANDARD",
  },
  token_percent: { type: Number, default: 15 },
  commission_percent: { type: Number, default: 7 },
  created_at: { type: Date, default: Date.now },
});

module.exports = model("Venue", venueSchema);
