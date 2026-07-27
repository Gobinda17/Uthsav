const { Schema, model } = require("mongoose");

const bookingSchema = new Schema({
  venue_id: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
  customer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  event_type: { type: String, required: true },
  event_date: { type: String, required: true },
  guest_count: { type: Number, required: true },
  venue_total: { type: Number, required: true },
  token_amount: { type: Number, required: true },
  commission_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED", "DISPUTED"],
    default: "PENDING",
  },
  created_at: { type: Date, default: Date.now },
  confirmed_at: { type: Date, default: null },
});

module.exports = model("Booking", bookingSchema);
