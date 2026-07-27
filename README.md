# Uthsav — Event Venue Booking Marketplace (Demo Scaffold)

A working full-stack prototype of the venue booking marketplace from the PRD:
discovery → venue detail → date-based booking with a token payment → owner
confirm/decline → owner earnings dashboard.

This is a **demo scaffold**, not production code — auth is a stand-in (phone +
name, no OTP), payments are simulated (no real Razorpay call), and there's no
masked calling. It's built to be a realistic, runnable base to iterate from.

## Stack

- **Backend:** Express.js + `better-sqlite3` (zero-setup local SQL database —
  no separate DB server to install). Schema is plain SQL in
  `backend/src/db/schema.sql`; the shapes map directly onto PostgreSQL if you
  move to it later — see PRD §10 for the target production stack.
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS, plain JavaScript.

## Quick start

You need Node.js 18+ installed. Two terminals:

**Terminal 1 — backend**
```bash
cd backend
npm install
cp .env.example .env
npm run seed      # populates 6 demo venues, 6 users, 3 sample bookings
npm run dev        # starts on http://localhost:4000
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev        # starts on http://localhost:3000
```

Open **http://localhost:3000**. Click "Find a venue" to browse and book;
click "List your venue" to see the owner dashboard and confirm/decline the
booking you just made.

## What's actually wired up

- Live venue discovery with event-type and text filtering
- Real per-date availability, pulled from the database
- A 3-step booking flow that creates a real `Booking` + `Payment` row and
  locks the date
- Owner dashboard: confirm/decline a pending request, see settled earnings
  (venue total minus commission) update live
- Cancellation-tier text and commission math match the PRD's proposed model
  (token % + 7% standard commission, configurable per venue)

## What's intentionally stubbed for the demo

- **Auth:** no OTP/session; booking just takes a phone + name and
  find-or-creates a user row. Swap in Msg91 OTP + JWT per the PRD before
  going further.
- **Payments:** `POST /api/bookings` marks the token payment `SUCCESS`
  immediately. In production this should create a `Razorpay Route` order,
  return a checkout session to the frontend, and only mark `SUCCESS` once the
  webhook confirms capture.
- **Masked calling / chat:** the "Message venue owner" button is present in
  the UI but not wired to anything — Exotel virtual numbers and the in-app
  chat layer from the PRD aren't built yet.
- **3D walkthrough:** the venue detail page shows a placeholder panel where
  the Polycam embed (or self-hosted `<model-viewer>`) would go. No real scans
  are wired in.
- **Admin / venue onboarding:** there's no UI yet for a venue owner to create
  a new listing — venues are only seeded via `backend/src/db/seed.js`.

## Project structure

```
backend/
  src/
    db/
      schema.sql       -- table definitions
      index.js         -- connection + schema bootstrap
      seed.js           -- demo data
    routes/
      venues.js         -- discovery, detail, availability
      bookings.js       -- create booking, confirm/decline
      owner.js           -- owner dashboard + earnings
    index.js             -- Express app entrypoint
  package.json

frontend/
  app/
    page.js              -- discovery homepage
    venue/[id]/page.js    -- venue detail + booking flow
    venue/[id]/confirmed/page.js
    owner/page.js         -- owner dashboard
    layout.js, globals.css
  components/
    Nav.js, VenueCard.js, GamosaRule.js
  lib/
    api.js                -- fetch wrapper around the backend API
  package.json
```

## Moving toward production

The fastest path from here, roughly in order:
1. Real auth (Msg91 OTP + JWT)
2. Real Razorpay Route integration (order creation + webhook handler)
3. Venue owner onboarding flow (currently seed-only)
4. Exotel masked calling + in-app chat
5. Move SQLite → PostgreSQL (swap `better-sqlite3` calls for `pg`; the SQL in
   `schema.sql` is close to drop-in compatible — mainly swap `TEXT` id/date
   columns for `UUID`/`DATE` types and `datetime('now')` for `now()`)
6. Polycam embed or self-hosted `.glb` + `<model-viewer>` on the venue page

See `venue-booking-prd-v0.1.md` for the full product spec this scaffold
implements a slice of.
