"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, TrendingUp, ShieldCheck, ClipboardList, Calendar as CalIcon } from "lucide-react";
import { api, inr } from "../../lib/api";
import { getSession } from "../../lib/auth";

const VENUE_STATUSES = ["DRAFT", "PENDING_REVIEW", "LIVE", "PAUSED", "DELISTED"];

export default function AdminPage() {
  const [session, setSessionState] = useState(undefined);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  useEffect(() => {
    if (!session || session.user.role !== "ADMIN") return;
    refresh();
  }, [session]);

  function refresh() {
    Promise.all([api.adminVenues(), api.adminBookings()])
      .then(([v, b]) => {
        setVenues(v);
        setBookings(b);
      })
      .catch((e) => setError(e.message));
  }

  async function respond(bookingId, status) {
    await api.patchBooking(bookingId, status);
    refresh();
  }

  async function updateVenueStatus(venueId, status) {
    await api.adminUpdateVenue(venueId, { status });
    refresh();
  }

  async function toggleVerified(venueId, verified) {
    await api.adminUpdateVenue(venueId, { verified: !verified });
    refresh();
  }

  if (session === undefined) return null;

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="max-w-sm mx-auto px-5 py-16 text-center">
        <p className="text-sm mb-4 text-[#8A7F6C]">Admin access required.</p>
        <Link href="/login" className="inline-block px-4 py-2 rounded text-sm font-medium bg-gamosa text-white">
          Log in
        </Link>
      </div>
    );
  }

  if (error) return <div className="max-w-5xl mx-auto px-5 py-10 text-sm text-gamosa">{error}</div>;

  const pending = bookings.filter((b) => b.status === "PENDING");
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  const pendingVenues = venues.filter((v) => v.status === "PENDING_REVIEW");
  const otherVenues = venues.filter((v) => v.status !== "PENDING_REVIEW");

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={20} className="text-teal" />
        <h1 className="font-display text-2xl text-ink">Admin control panel</h1>
      </div>
      <p className="text-sm mb-6 text-[#8A7F6C]">Every venue and booking, across every owner.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={ClipboardList} label="Pending listings" value={pendingVenues.length} />
        <StatCard icon={Bell} label="Pending requests" value={pending.length} />
        <StatCard icon={Calendar} label="Confirmed bookings" value={confirmed.length} />
        <StatCard icon={TrendingUp} label="Venues listed" value={venues.length} />
      </div>

      {pendingVenues.length > 0 && (
        <>
          <h2 className="font-display text-lg mb-3 text-ink">Pending approval</h2>
          <div className="space-y-3 mb-10">
            {pendingVenues.map((v) => (
              <div key={v.id} className="border rounded-md p-4 flex items-center justify-between gap-4 border-line bg-paperDim">
                <div>
                  <p className="text-sm font-medium text-ink">{v.name}</p>
                  <p className="text-xs mt-0.5 text-[#8A7F6C]">
                    Owner: {v.ownerName || "—"} · {v.ownerPhone || "—"} · {v.area}, {v.city}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateVenueStatus(v.id, "DELISTED")}
                    className="px-3 py-1.5 rounded text-xs border border-line text-ink"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateVenueStatus(v.id, "LIVE")}
                    className="px-3 py-1.5 rounded text-xs bg-teal text-white"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="font-display text-lg mb-3 text-ink">Venues</h2>
      <div className="space-y-3 mb-10">
        {otherVenues.map((v) => (
          <div key={v.id} className="border rounded-md p-4 flex items-center justify-between gap-4 border-line">
            <div>
              <p className="text-sm font-medium text-ink">{v.name}</p>
              <p className="text-xs mt-0.5 text-[#8A7F6C]">
                Owner: {v.ownerName || "—"} · {v.ownerPhone || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleVerified(v.id, v.verified)}
                className="px-3 py-1.5 rounded text-xs border border-line text-ink"
              >
                {v.verified ? "Unverify" : "Verify"}
              </button>
              <select
                value={v.status}
                onChange={(e) => updateVenueStatus(v.id, e.target.value)}
                className="px-2 py-1.5 rounded text-xs border border-line text-ink bg-transparent"
              >
                {VENUE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {otherVenues.length === 0 && <p className="text-sm py-8 text-center text-[#8A7F6C]">No venues yet.</p>}
      </div>

      <h2 className="font-display text-lg mb-3 text-ink">Booking requests</h2>
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="border rounded-md p-4 flex items-center justify-between gap-4 border-line">
            <div>
              <p className="text-sm font-medium text-ink">{b.customerName}</p>
              <p className="text-xs mt-0.5 flex items-center gap-3 text-[#8A7F6C]">
                <span className="flex items-center gap-1"><CalIcon size={11} /> {b.eventDate}</span>
                <span>{b.eventType}</span>
                <span>{b.venueName}</span>
                <span className="font-mono">Token {inr(b.tokenAmount)}</span>
              </p>
            </div>
            {b.status === "PENDING" ? (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => respond(b.id, "DECLINED")}
                  className="px-3 py-1.5 rounded text-xs border border-line text-ink"
                >
                  Decline
                </button>
                <button
                  onClick={() => respond(b.id, "CONFIRMED")}
                  className="px-3 py-1.5 rounded text-xs bg-teal text-white"
                >
                  Confirm
                </button>
              </div>
            ) : (
              <span
                className="text-xs px-2.5 py-1 rounded-full shrink-0"
                style={{
                  background: b.status === "CONFIRMED" ? "#E4EEE9" : "#F3E4E0",
                  color: b.status === "CONFIRMED" ? "#28483E" : "#A63A2E",
                }}
              >
                {b.status === "CONFIRMED" ? "Confirmed" : b.status}
              </span>
            )}
          </div>
        ))}
        {bookings.length === 0 && <p className="text-sm py-8 text-center text-[#8A7F6C]">No booking requests yet.</p>}
      </div>
    </div>
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
