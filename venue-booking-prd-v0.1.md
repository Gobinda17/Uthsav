# Event Venue Booking Platform — PRD v0.1

> **Working codename:** `[TBD — see Appendix A for naming options]`
> **Owner:** Gobinda / Cybernet
> **Status:** First draft — for internal review, not for external circulation
> **Last updated:** 14 July 2026

---

## 1. Overview

A two-sided marketplace that lets people in Assam discover, verify, and book event venues online — with a differentiated 3D walkthrough experience — and lets venue owners fill their calendars with less phone-tag and paperwork.

**One-liner:** *BookMyShow for event venues, starting in Assam, with 3D walkthroughs so you don't have to visit five halls to pick one.*

**North-star metric (v1):** Confirmed bookings per month (with token payment collected through the platform).

---

## 2. Problem & Opportunity

### 2.1 The current experience in Assam

Booking an event venue in Guwahati or any Tier-2 town in Assam today looks like this:

1. Ask friends / family for recommendations, or scroll Facebook / Instagram / Google Maps.
2. Get a phone number, call the venue owner, ask if `<date>` is available.
3. Drive to the venue for an in-person visit. Repeat 3–5 times before deciding.
4. Negotiate rate. Pay a token in cash or bank transfer with no written escrow.
5. Hope nothing goes wrong; no meaningful recourse if it does.

Pain points:

- **Discovery is broken.** No unified catalogue of venues by location, capacity, or event type.
- **Availability is opaque.** Every enquiry is a phone call.
- **Trust is offline.** Reviews live in WhatsApp forwards, not in one searchable place.
- **Payments are informal.** No escrow, no receipt, no dispute mechanism.
- **Venue owners lose leads.** Missed calls, WhatsApp overload, no CRM.

### 2.2 Why now, why Assam

- Smartphone + UPI penetration in Assam has crossed the threshold where a booking flow like this is viable end-to-end.
- Wedding + event spend in NE India is growing but has almost no vertical SaaS/marketplace serving it (WedMeGood, VenueLook etc. are heavily metro-focused).
- Gobinda / Cybernet has existing supply-side relationships (venues, event partners, political + government network) that shorten the cold-start problem.

### 2.3 Strategic note on "all events"

We're launching with **all event types** rather than a wedding-only wedge. This maximises addressable supply and demand but has real tradeoffs:

- **Supply-side onboarding** becomes more varied — a namghar community hall and a five-star banquet hall need different fields, different photography, different price framing.
- **Filtering UX** has to flex across event types (a birthday buyer cares about different amenities than a corporate offsite buyer).
- **Marketing** risks feeling generic. Mitigation: lead public messaging with **weddings** in year one (highest ticket, highest search intent), while quietly supporting all events on the platform. Weddings pull people in; the platform serves everything.

---

## 3. Target Users

### 3.1 Customer personas

| Persona | Event type | Ticket size | Decision cycle | Key needs |
|---|---|---|---|---|
| **Wedding family** | Wedding, reception, engagement, mehendi | ₹1L–₹15L venue | 3–9 months | Photos, 3D, capacity, catering, parking, decoration flexibility, refund safety |
| **Corporate admin** | Conference, offsite, product launch, town hall | ₹20k–₹5L | 3–21 days | GST invoice, AV setup, WiFi, seating configs, quick confirmation |
| **Birthday host** | Kids' birthday, adult birthday, anniversary | ₹5k–₹50k | 2–4 weeks | Price, cake-cutting space, decoration options, kid-safe |
| **Community organiser** | Bihu, Puja, cultural function, religious event | ₹10k–₹1L | 2–8 weeks | Capacity, elders' seating, cultural fit, catering rules |
| **Cybernet-adjacent political client** | Meetings, rallies, gatherings | ₹20k–₹2L | 1–14 days | Discretion, capacity, security, quick turnaround |

### 3.2 Venue owner personas

| Persona | Description | Digital comfort |
|---|---|---|
| **Banquet hall owner** | Owns 1–3 halls, ₹30k–₹3L per event | Medium (WhatsApp, basic Excel) |
| **Hotel event manager** | Salaried, manages a property's event calendar | High (uses PMS software) |
| **Community hall trustee** | Manages a namghar / community space, part-time | Low (phone calls only) |
| **Farmhouse / resort owner** | Weekend / wedding-focused property | Medium |

The MVP has to be usable by the community hall trustee **on a phone**, not just the hotel manager on a laptop.

---

## 4. MVP Scope

### 4.1 In scope (v1)

**Customer side**
- Location-based venue discovery (Guwahati → wider Assam)
- Filters: event type, date, capacity, price range, amenities
- Venue detail page: photos, 3D walkthrough, amenities, pricing, availability calendar, reviews
- Date selection + availability check (real-time)
- Token booking via Razorpay UPI/cards/netbanking
- In-app chat with venue owner (masked)
- Booking history, receipts
- Reviews after event

**Venue owner side**
- Onboarding (KYC, venue details, photo upload, 3D scan upload)
- Availability calendar management (block dates, set pricing, set rules)
- Booking notifications (WhatsApp + SMS + in-app)
- Confirm / decline booking within SLA
- Chat with customer (masked)
- Settlement dashboard: bookings, commission, payouts

**Platform**
- Admin panel: venue verification, dispute handling, refunds, commission overrides
- Payment escrow via Razorpay Route
- Masked calling (Exotel)
- Basic analytics (bookings, GMV, conversion funnel)

### 4.2 Explicitly out of scope (v1)

- Vendor marketplace (caterers, decorators, photographers) — v2
- Full event planning tools (guest list, invite management) — v3
- Native mobile apps — v1.5, after web PWA validates demand
- Multi-city expansion beyond Assam — post-PMF
- Dynamic pricing / yield management — v2
- Insurance products — later

### 4.3 v1 success criteria (6 months post-launch)

- 50+ verified venues live in Guwahati
- 30+ confirmed paid bookings per month
- <10% dispute rate
- >4.0 average rating
- 60%+ of bookings originate on mobile web

---

## 5. Core Entities (data model sketch)

```
User (id, phone, email, name, role: [customer, venue_owner, admin], kyc_status)
  └─ has many Bookings (as customer)
  └─ has many Venues (as venue_owner)

Venue (id, owner_id, name, description, address, city, lat, lng,
       capacity_min, capacity_max, base_price_per_slot, price_notes,
       status: [draft, pending_review, live, paused, delisted],
       supported_event_types: [wedding, corporate, birthday, ...])
  └─ has many Photos
  └─ has one ThreeDAsset (polycam_embed_url OR self_hosted_glb_url)
  └─ has many Amenities (many-to-many with Amenity)
  └─ has many AvailabilitySlots (date, slot: [morning, evening, full_day], status, price_override)
  └─ has many Bookings
  └─ has many Reviews

Amenity (id, name, icon, category: [space, catering, tech, comfort, parking])

Booking (id, venue_id, customer_id, event_type, event_date, slot,
         guest_count, venue_total, token_amount, commission_amount,
         status: [pending, confirmed, cancelled, completed, disputed],
         payment_status, created_at, confirmed_at)
  └─ has many PaymentTransactions
  └─ has one Conversation

Payment (id, booking_id, amount, type: [token, balance, refund, payout],
         razorpay_ref, status, created_at)

Conversation (id, booking_id, customer_id, venue_owner_id, masked_number)
  └─ has many Messages

Review (id, booking_id, customer_id, venue_id, rating, text, created_at)
```

*Note: This is a v0 sketch. Expect migrations. Prioritise getting the Booking + Payment shapes right in week one — everything else can evolve.*

---

## 6. Key User Flows

### 6.1 Customer: discover → book

1. Lands on homepage → sees location auto-detected (Guwahati) + event-type quick filters.
2. Selects "Weddings" (or any event type) → sees a grid of venues with photo, price range, capacity, rating.
3. Applies filters (date, capacity, amenities) → grid updates. Venues without the date available are dimmed with "Not available on <date>" tag.
4. Opens venue detail page → photos carousel, 3D walkthrough embed, amenities list, calendar, reviews, price breakdown, "Chat with owner" button (gated behind login).
5. Selects date + slot → sees final price (venue total + platform fee if any) + token amount.
6. Login/signup via OTP → completes token payment via Razorpay checkout.
7. Booking enters `pending` state → notification fires to venue owner.
8. Venue owner confirms within SLA (e.g. 6 hours) → booking becomes `confirmed`; customer gets confirmation + masked number for calls.
9. Event happens → 24 hours after event date, booking auto-transitions to `completed` unless disputed.
10. Customer prompted for review.

### 6.2 Venue owner: onboard → fulfill

1. Signs up via phone OTP → chooses "I own a venue".
2. Onboarding wizard: business KYC (PAN, GST optional, trade license optional but preferred), venue details, photos, price grid, amenities, cancellation policy selection.
3. Books a Polycam scan (self-serve tutorial OR Cybernet-assisted service, see §7).
4. Venue enters `pending_review` → admin verifies within 48 hours.
5. Goes live → starts receiving booking requests.
6. Notification arrives (WhatsApp + SMS + dashboard) → owner confirms or declines within SLA.
7. On event day, owner marks event completed → settlement scheduled per policy (e.g. T+3 days post-event, commission deducted).

### 6.3 Payment & settlement lifecycle

```
Customer pays token → Held in Razorpay Route escrow
  ↓
Venue confirms → Token stays in escrow
  ↓
Event date reached
  ↓
T+3 days post-event → Auto-settle: (token - commission) → venue owner payout
  ↓
Commission → platform revenue account
```

**Cancellation policy tiers (customer can see per venue):**

| Cancellation window | Refund |
|---|---|
| >30 days before event | 100% of token refunded |
| 15–30 days | 50% refunded |
| 7–15 days | 25% refunded |
| <7 days | Non-refundable |

Venue owners choose from three tier presets; can't set custom policies in v1 (reduces complexity).

---

## 7. 3D Walkthrough Approach

### 7.1 v1 (weeks 1–12): Polycam embed

- Venue owners (or Cybernet field team, for a fee) scan the venue using Polycam mobile app.
- Polycam auto-generates a share link with an embeddable web viewer.
- We store `polycam_embed_url` on the Venue record and iframe it into the detail page.
- **Pros:** zero engineering; scans are hosted by Polycam.
- **Cons:** Polycam branding shows; if Polycam changes policies/pricing, we're exposed.

### 7.2 v1.5 (month 4+): self-hosted `.glb`

- Export from Polycam as `.glb` (or `.usdz` for iOS AR).
- Store in S3 / Cloudflare R2.
- Embed with Google's `<model-viewer>` web component (~10 lines).
- **Pros:** our branding, our infrastructure, no third-party dependency.
- **Cons:** we manage hosting and viewer performance.

### 7.3 v2 (later): Gaussian splats for premium venues

- Polycam supports splat capture — output looks near-photoreal.
- Embed via `gsplat.js` or similar. Reserve for premium venues (weddings, luxury banquets).
- Bandwidth and file sizes are higher; not for every venue.

### 7.4 Field operations note

Scanning is the bottleneck. Options:

- **DIY tutorial** for owner: video guide + Polycam app.
- **Assisted service** by Cybernet: field team scans on demand for a fee (₹1000–₹2000 per venue). Recover cost as onboarding revenue.

I'd default to **assisted service in Guwahati** for the first 20 venues to guarantee quality, then transition to DIY.

---

## 8. Payment & Monetization

### 8.1 Token booking mechanics

**Token amount options** (venue owner chooses one at onboarding, can revise per calendar slot):

- **Fixed token:** flat ₹1000 / ₹2500 / ₹5000
- **Percentage token:** 10% / 15% / 20% of venue slot price (auto-calculated)

For sub-₹20k events (birthdays, small gatherings), a fixed ₹1000–₹2000 works. For weddings, percentage-based makes more sense — you want higher skin in the game to prevent frivolous bookings.

### 8.2 Commission structure

- **Standard:** 7% on the venue slot price (not on the token — on the total venue value the customer is committing to).
- **Volume discount:** venues with 10+ confirmed bookings/quarter → 5%.
- **Featured listing tier (v1.5):** flat ₹999/month for boosted placement + 3D walkthrough scanning credit; unchanged commission.

*Assumption to validate: 7% is defensible for our value (leads + escrow + 3D + masked comms). Benchmark against WedMeGood (~10% on some categories), OYO / MakeMyTrip (15–25% on hotels — but they own more of the stack).*

### 8.3 Payment rail: Razorpay Route

Razorpay Route lets us split a payment between multiple accounts at capture time. Setup:

1. Each venue owner has a linked account (KYC via Razorpay).
2. Customer pays full token to platform's Razorpay account.
3. Funds held in escrow (Route's "on-hold" state) until settlement trigger.
4. On settlement: commission stays with platform account; balance transfers to venue owner's linked account.

**Fallback:** Cashfree Payouts if Razorpay Route limits become an issue at scale.

### 8.4 GST & compliance

- Platform charges GST on commission (18%).
- If the venue owner is GST-registered, they issue an invoice to the customer for the venue amount; platform issues an invoice for the commission to the venue owner.
- If not GST-registered (community halls, small operators) — platform can offer a simplified receipt to the customer, but not a tax invoice. Flag on venue page: "Invoice type: receipt only" vs "GST invoice available".

*Legal review needed before launch.*

---

## 9. Anti-Disintermediation Strategy

The classic marketplace problem: what stops the customer and venue owner from going direct after discovery, cutting the platform out?

**Layer 1 — Masked communication**
- Exotel-based virtual number. Both parties see a platform-generated number; calls route through Exotel and are logged.
- Number is revealed *only after* token payment is collected. Pre-payment, everything is in-app chat.
- Cost: ~₹0.60 per minute of call routing. Absorbed as CAC in v1.

**Layer 2 — In-app chat as default**
- All pre-booking conversation lives in the app.
- Detect and filter shared phone numbers / UPI IDs in chat messages (regex on first pass; ML-based later).
- Show a soft warning: "For your safety, complete booking on the platform. Off-platform bookings aren't protected by our refund policy."

**Layer 3 — Money as the real moat**
- The token in escrow is the customer's insurance. Going off-platform means paying cash to a stranger with no recourse.
- Repeat customers get benefits (booking history, priority support, discounts) that are lost if they go off-platform.

**Layer 4 — Owner-side incentives**
- Rankings favour venues with high on-platform booking rates. Skipping the platform hurts visibility.
- Featured tier is only available to venues with clean on-platform behaviour.

---

## 10. Tech Stack

Aligned with your existing stack (DigitalScoreAI, Udbhaban) to minimise context switching.

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend web** | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui | Familiar; SSR helps SEO for venue pages |
| **Backend API** | FastAPI (Python) + PostgreSQL + Redis | Matches DigitalScoreAI; async-friendly for booking flows |
| **Auth** | OTP-based via Msg91; JWT sessions | Phone-first for Indian users |
| **Payments** | Razorpay Route | Marketplace splits + escrow |
| **Storage** | Cloudflare R2 (photos, GLB files) | Cheaper egress than S3; fine for v1 |
| **3D viewer** | Polycam embed → `<model-viewer>` | See §7 |
| **Calling** | Exotel virtual numbers | Best India-native masked-calling API |
| **Chat** | Custom WebSocket (FastAPI) or Ably | Ably is faster to ship; custom is cheaper long-term |
| **Notifications** | Msg91 (SMS + WhatsApp Business), FCM (later for PWA/native) | Msg91 has good WhatsApp support in India |
| **Email** | Resend | Cheap, dev-friendly |
| **Search** | Postgres full-text + PostGIS for location | Meilisearch if we outgrow it |
| **Hosting** | Vercel (frontend), Hetzner or DigitalOcean droplet (backend), Cloudflare CDN | Cost-optimised for a pre-revenue product |
| **Observability** | Sentry + PostHog | Errors + product analytics in one shot |
| **Admin panel** | Refine or Retool-style Next.js internal app | Fast to build; admin needs are simple in v1 |

**Deliberate exclusions from v1:**
- Kubernetes — overkill; use Docker Compose or plain deployments.
- Microservices — start with a modular monolith. Split later if load demands.
- LangGraph / AI features — the platform is not AI-first in v1. Fold in later (venue recommendations, chatbot support).

---

## 11. Phased Roadmap

### Phase 0 — Foundations (Weeks 1–2)
- Lock name + brand
- Finalise PRD (this doc → v1.0)
- Legal setup: entity structure, GST registration, terms of service, privacy policy
- Domain, hosting, Razorpay + Exotel + Msg91 account setup
- Design system: Figma tokens, component library baseline

### Phase 1 — MVP build (Weeks 3–10)
- Backend: entities, auth, venue CRUD, booking flow, payment integration, admin panel
- Frontend: landing, discovery, venue detail, booking flow, customer + owner dashboards
- 3D walkthrough integration (Polycam embed path)
- Notifications wiring
- Internal testing with 3–5 pilot venues (Cybernet's own network — Urban Caterers, others)

### Phase 2 — Guwahati pilot (Weeks 11–16)
- Onboard 15–20 real venues (mix of banquet, community hall, farmhouse, hotel)
- Field team scans all 20 venues with Polycam
- Soft launch: invited customers only (Gobinda's network, Cybernet's existing client contacts)
- Iterate on booking flow, chat, payment issues
- First paid bookings

### Phase 3 — Public launch, Assam (Months 5–8)
- Public marketing push (Facebook + Instagram + Google in Guwahati, then Dibrugarh, Jorhat, Silchar, Tezpur)
- Target: 50+ venues live, 30+ paid bookings/month
- Featured listings tier goes live
- Self-hosted `.glb` walkthrough migration begins

### Phase 4 — NE India expansion (Months 9–12)
- Meghalaya (Shillong) — leverage Cybernet's Prestone Tynsong network
- Arunachal (Itanagar) — leverage existing Pema Khandu / Chowna Mein work
- Assam Tier-3 towns

### Phase 5 — Adjacent products (Year 2)
- Vendor marketplace (caterers, decorators, photographers)
- Native apps (React Native, sharing logic with web)
- AI recommendations, dynamic pricing
- B2B corporate accounts

---

## 12. Team & Operations (open)

Questions to resolve before Phase 1 kicks off:

- Is this a Cybernet product, a separate entity, or your solo side project? Affects funding, ownership, tax structure.
- Who's on the initial team? Realistically, building this alongside NIC day job + DigitalScoreAI + Cybernet client work is a lot. Options:
  - Solo, nights + weekends → likely 6-month MVP timeline
  - +1 developer (freelance or hire) → likely 3-month MVP
  - Cybernet team allocation → depends on client load
- Field ops for venue onboarding: who's doing the Polycam scans, KYC verification, and venue photography? Needs at least one person on the ground in Guwahati.
- Legal + compliance: engage a CA and a lawyer for entity + GST + ToS. Budget ~₹30k–₹50k one-time.

---

## 13. Risks & Open Questions

**Product risks**
- All-events scope may dilute early positioning. Mitigation: lead with weddings in marketing.
- 3D walkthroughs may not move the needle if customers still want in-person visits. Test in Phase 2 with A/B on venues with vs without walkthrough.
- Community-hall segment may not tolerate any digital payment friction. May need cash-collection fallback.

**Business risks**
- Cold-start on supply: no customers if no venues, no venues if no customers. Mitigation: Cybernet's existing network + assisted scanning as free-value onboarding.
- Disintermediation: some percentage will always happen. Model 20–30% off-platform bookings in year one.
- Refund disputes at scale — need clear ops process before month 3.

**Open questions to close before v1.0 of this PRD**
- Product name + brand direction
- Team + funding structure
- Exact commission % (7% is a starting proposal; validate with 3–5 venue owners)
- Cancellation policy tiers (proposed above; validate)
- GST treatment for non-registered community halls (needs CA input)
- Whether to charge customers a small platform fee (₹49–₹99) on top of token, or stay pure zero-fee for the demand side

---

## Appendix A — Naming options

Some starting directions (not final):

| Name | Vibe | Notes |
|---|---|---|
| **VenueHive** | Modern, marketplace-y | .in likely available |
| **Uthsav** (উৎসৱ / उत्सव) | Regional, celebratory | Assamese/Sanskrit for "festival"; strong local resonance |
| **HallBook** | Descriptive | Boring but instantly clear |
| **BhorTaal** | Regional, evocative | Assamese; may narrow perception |
| **Anjali** | Cultural | Common name; hard to trademark |
| **VenueGully** | Playful | Contemporary Indian brand feel |
| **EventNest** | Warm, generic | Available on most TLDs |

Recommendation: pick something with regional resonance (Uthsav-like) if the plan is to stay NE India-focused for 3+ years; pick something neutral (VenueHive / EventNest) if pan-India is on the horizon.

---

## Appendix B — Immediate next steps (this week)

1. Review this PRD; mark disagreements + open questions in a shared doc
2. Lock product name (or narrow to top 2 for domain checking)
3. Sketch 3–5 core screens in Figma (homepage, discovery, venue detail, booking flow, owner dashboard)
4. Reach out to 5 venue owners in Gobinda's network for 20-min interviews — validate token size, commission, cancellation preferences
5. Set up Razorpay + Exotel + Msg91 sandbox accounts
6. Register domain(s)
7. Move PRD to v1.0 with all open items closed

---

*End of first draft. Feedback welcome — mark up freely.*
