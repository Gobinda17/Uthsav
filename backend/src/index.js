require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectDB } = require("./db");
const venuesRouter = require("./routes/venues");
const bookingsRouter = require("./routes/bookings");
const ownerRouter = require("./routes/owner");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "uthsav-backend" }));

app.use("/api/auth", authRouter);
app.use("/api/venues", venuesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/admin", adminRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Uthsav backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
