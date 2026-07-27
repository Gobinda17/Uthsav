-- Uthsav — Event Venue Booking Marketplace
-- SQLite schema for local dev. Column shapes map directly onto the
-- PostgreSQL tables you'd use in production (see PRD §5 / §10).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER | VENUE_OWNER | ADMIN
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Guwahati',
  capacity_min INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  base_price INTEGER NOT NULL, -- INR
  verified INTEGER NOT NULL DEFAULT 0, -- 0/1
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- DRAFT|PENDING_REVIEW|LIVE|PAUSED|DELISTED
  event_types TEXT NOT NULL, -- comma-separated
  amenities TEXT NOT NULL, -- comma-separated
  three_d_url TEXT,
  cancellation_tier TEXT NOT NULL DEFAULT 'STANDARD', -- STANDARD|STRICT|FLEXIBLE
  token_percent INTEGER NOT NULL DEFAULT 15,
  commission_percent INTEGER NOT NULL DEFAULT 7,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(id),
  date TEXT NOT NULL, -- ISO date
  available INTEGER NOT NULL DEFAULT 1,
  price_override INTEGER,
  UNIQUE(venue_id, date)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(id),
  customer_id TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  venue_total INTEGER NOT NULL,
  token_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|CONFIRMED|DECLINED|CANCELLED|COMPLETED|DISPUTED
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- TOKEN|BALANCE|REFUND|PAYOUT
  status TEXT NOT NULL DEFAULT 'INITIATED', -- INITIATED|SUCCESS|FAILED|REFUNDED
  razorpay_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(id),
  customer_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
