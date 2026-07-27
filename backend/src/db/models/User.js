const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  role: {
    type: String,
    enum: ["CUSTOMER", "VENUE_OWNER", "ADMIN"],
    default: "CUSTOMER",
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = model("User", userSchema);
