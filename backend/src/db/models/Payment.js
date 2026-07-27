const { Schema, model } = require("mongoose");

const paymentSchema = new Schema({
  booking_id: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["TOKEN", "BALANCE", "REFUND", "PAYOUT"], required: true },
  status: {
    type: String,
    enum: ["INITIATED", "SUCCESS", "FAILED", "REFUNDED"],
    default: "INITIATED",
  },
  razorpay_ref: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = model("Payment", paymentSchema);
