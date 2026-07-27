"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, TrendingUp, BadgeCheck, Plus, X, Calendar as CalIcon } from "lucide-react";
import { api, inr } from "../../lib/api";
import { getSession } from "../../lib/auth";

const STATUS_LABEL = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  LIVE: "Live",
  PAUSED: "Paused",
  DELISTED: "Delisted",
};

export default function OwnerPage() {
  const [session, setSessionState] = useState(undefined); // undefined = not checked yet
  const [venues, setVenues] = useState([]);
  const [venuesLoaded, setVenuesLoaded] = useState(false);
  const [venueId, setVenueId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  useEffect(() => {
    if (!session || !["VENUE_OWNER", "ADMIN"].includes(session.user.role)) return;
    refreshVenues();
  }, [session]);

  useEffect(() => {
    if (!venueId) return;
    api.ownerDashboard(venueId).then(setDashboard).catch((e) => setError(e.message));
  }, [venueId]);

  function refreshVenues(selectId) {
    api.ownerVenues().then((vs) => {
      setVenues(vs);
      setVenuesLoaded(true);
      if (selectId) setVenueId(selectId);
      else if (vs.length && !venueId) setVenueId(vs[0].id);
    }).catch((e) => setError(e.message));
  }

  async function respond(bookingId, status) {
    await api.patchBooking(bookingId, status);
    const fresh = await api.ownerDashboard(venueId);
    setDashboard(fresh);
  }

  async function handleCreateVenue(payload) {
    const venue = await api.createVenue(payload);
    setShowCreateForm(false);
    refreshVenues(venue.id);
  }

  if (session === undefined) return null; // checking localStorage

  if (!session || !["VENUE_OWNER", "ADMIN"].includes(session.user.role)) {
    return (
      <div className="max-w-sm mx-auto px-5 py-16 text-center">
        <p className="text-sm mb-4 text-[#8A7F6C]">Log in as a venue owner to view your dashboard.</p>
        <Link href="/login" className="inline-block px-4 py-2 rounded text-sm font-medium bg-gamosa text-white">
          Log in
        </Link>
      </div>
    );
  }

  if (error) return <div className="max-w-5xl mx-auto px-5 py-10 text-sm text-gamosa">{error}</div>;
  if (!venuesLoaded) return <div className="max-w-5xl mx-auto px-5 py-10 text-sm text-[#8A7F6C]">Loading…</div>;

  if (showCreateForm) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-ink">List a new venue</h2>
          <button onClick={() => setShowCreateForm(false)} className="text-[#8A7F6C]"><X size={20} /></button>
        </div>
        <CreateVenueForm onSubmit={handleCreateVenue} />
      </div>
    );
  }

  if (!venues.length) {
    return (
      <div className="max-w-sm mx-auto px-5 py-16 text-center">
        <p className="text-sm mb-4 text-[#8A7F6C]">You haven't listed a venue yet.</p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-gamosa text-white"
        >
          <Plus size={15} /> List your venue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-1">
        <select
          value={venueId || ""}
          onChange={(e) => setVenueId(e.target.value)}
          className="font-display text-2xl text-ink bg-transparent outline-none border-b border-line pb-1"
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          {dashboard && (
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: dashboard.venue.status === "LIVE" ? "#E4EEE9" : "#F0EADC",
                color: dashboard.venue.status === "LIVE" ? "#28483E" : "#6B6152",
              }}
            >
              {dashboard.venue.verified && dashboard.venue.status === "LIVE" && <BadgeCheck size={12} className="inline mr-1 -mt-0.5" />}
              {STATUS_LABEL[dashboard.venue.status] || dashboard.venue.status}
            </span>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border border-line text-ink"
          >
            <Plus size={12} /> Add venue
          </button>
        </div>
      </div>
      <p className="text-sm mb-6 text-[#8A7F6C]">Owner dashboard</p>

      {dashboard && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard icon={Bell} label="Pending requests" value={dashboard.counts.pending} />
            <StatCard icon={Calendar} label="Confirmed bookings" value={dashboard.counts.confirmed} />
            <StatCard icon={TrendingUp} label="Settled earnings" value={inr(dashboard.settledEarnings)} />
          </div>

          <h3 className="font-display text-lg mb-3 text-ink">Booking requests</h3>
          <div className="space-y-3">
            {dashboard.bookings.map((r) => (
              <div key={r.id} className="border rounded-md p-4 flex items-center justify-between gap-4 border-line">
                <div>
                  <p className="text-sm font-medium text-ink">{r.customer}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-3 text-[#8A7F6C]">
                    <span className="flex items-center gap-1"><CalIcon size={11} /> {r.eventDate}</span>
                    <span>{r.eventType}</span>
                    <span className="font-mono">Token {inr(r.tokenAmount)}</span>
                  </p>
                </div>
                {r.status === "PENDING" ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => respond(r.id, "DECLINED")}
                      className="px-3 py-1.5 rounded text-xs border border-line text-ink"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => respond(r.id, "CONFIRMED")}
                      className="px-3 py-1.5 rounded text-xs bg-teal text-white"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: r.status === "CONFIRMED" ? "#E4EEE9" : "#F3E4E0",
                      color: r.status === "CONFIRMED" ? "#28483E" : "#A63A2E",
                    }}
                  >
                    {r.status === "CONFIRMED" ? "Confirmed" : r.status}
                  </span>
                )}
              </div>
            ))}
            {dashboard.bookings.length === 0 && (
              <p className="text-sm py-8 text-center text-[#8A7F6C]">No booking requests yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CreateVenueForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Guwahati");
  const [capacityMin, setCapacityMin] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [amenities, setAmenities] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const valid = name && description && area && capacityMin && capacityMax && basePrice && eventTypes && amenities;

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name,
        description,
        area,
        city,
        capacity_min: Number(capacityMin),
        capacity_max: Number(capacityMax),
        base_price: Number(basePrice),
        event_types: eventTypes.split(",").map((s) => s.trim()).filter(Boolean),
        amenities: amenities.split(",").map((s) => s.trim()).filter(Boolean),
      });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm mb-6 text-[#8A7F6C]">
        Submitted listings go to our team for review before they appear publicly.
      </p>

      <label className="text-sm font-medium block mb-2 text-ink">Venue name</label>
      <input
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Brahmaputra Riverside Banquet"
        className="w-full border rounded px-3 py-2 text-sm mb-4 border-line outline-none"
      />

      <label className="text-sm font-medium block mb-2 text-ink">Description</label>
      <textarea
        value={description} onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="What makes this venue a good fit for events?"
        className="w-full border rounded px-3 py-2 text-sm mb-4 border-line outline-none"
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">Area</label>
          <input
            value={area} onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Fancy Bazar"
            className="w-full border rounded px-3 py-2 text-sm border-line outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">City</label>
          <input
            value={city} onChange={(e) => setCity(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm border-line outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">Min guests</label>
          <input
            type="number" min={1} value={capacityMin} onChange={(e) => setCapacityMin(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm border-line outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">Max guests</label>
          <input
            type="number" min={1} value={capacityMax} onChange={(e) => setCapacityMax(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm border-line outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">Base price (₹)</label>
          <input
            type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm border-line outline-none"
          />
        </div>
      </div>

      <label className="text-sm font-medium block mb-2 text-ink">Event types</label>
      <input
        value={eventTypes} onChange={(e) => setEventTypes(e.target.value)}
        placeholder="Wedding, Reception, Corporate"
        className="w-full border rounded px-3 py-2 text-sm mb-1 border-line outline-none"
      />
      <p className="text-xs mb-4 text-[#8A7F6C]">Comma-separated</p>

      <label className="text-sm font-medium block mb-2 text-ink">Amenities</label>
      <input
        value={amenities} onChange={(e) => setAmenities(e.target.value)}
        placeholder="Parking, Catering, AC"
        className="w-full border rounded px-3 py-2 text-sm mb-1 border-line outline-none"
      />
      <p className="text-xs mb-6 text-[#8A7F6C]">Comma-separated</p>

      {error && <p className="text-sm text-gamosa mb-4">{error}</p>}

      <button
        disabled={!valid || submitting}
        className="w-full py-2.5 rounded text-sm font-medium bg-gamosa text-white disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="border rounded-md p-4 border-line">
      <Icon size={16} className="mb-2 text-gamosa" />
      <p className="font-mono text-xl text-ink">{value}</p>
      <p className="text-xs mt-0.5 text-[#8A7F6C]">{label}</p>
    </div>
  );
}
