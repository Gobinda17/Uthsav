const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/uthsav";

mongoose.connection.on("connected", () => {
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
}

module.exports = { mongoose, connectDB };
