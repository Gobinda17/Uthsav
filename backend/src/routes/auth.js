const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../db/models");
const { serialize } = require("../utils/serialize");
const { signToken, requireAuth } = require("../middleware/auth");
const { normalizePhone } = require("../utils/phone");
const router = express.Router();

// POST /api/auth/register  { phone, name, password }
// Self-registration is owner-only — ADMIN accounts are seeded, never self-served.
router.post("/register", async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const phone = normalizePhone(req.body.phone);
    if (!phone || !name || !password) {
      return res.status(400).json({ error: "phone, name and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: "An account with this phone number already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ phone, name, password_hash, role: "VENUE_OWNER" });

    res.status(201).json({ token: signToken(user), user: serialize(sanitize(user.toObject())) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  { phone, password }
router.post("/login", async (req, res, next) => {
  try {
    const { password } = req.body;
    const phone = normalizePhone(req.body.phone);
    if (!phone || !password) {
      return res.status(400).json({ error: "phone and password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Invalid phone number or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid phone number or password" });
    }

    res.json({ token: signToken(user), user: serialize(sanitize(user.toObject())) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(serialize(sanitize(user)));
  } catch (err) {
    next(err);
  }
});

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

module.exports = router;
