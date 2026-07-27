const { Schema, model } = require("mongoose");

const reviewSchema = new Schema({
  venue_id: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
  customer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true },
  text: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = model("Review", reviewSchema);
