const { Schema, model } = require("mongoose");

const availabilitySlotSchema = new Schema({
  venue_id: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
  date: { type: String, required: true }, // ISO date
  available: { type: Boolean, default: true },
  price_override: { type: Number },
});

availabilitySlotSchema.index({ venue_id: 1, date: 1 }, { unique: true });

module.exports = model("AvailabilitySlot", availabilitySlotSchema);
