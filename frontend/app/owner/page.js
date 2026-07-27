"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar, TrendingUp, BadgeCheck, Calendar as CalIcon } from "lucide-react";
import { api, inr } from "../../lib/api";

export default function OwnerPage() {
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.ownerVenues().then((vs) => {
      setVenues(vs);
      if (vs.length) setVenueId(vs[0].id);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!venueId) return;
    api.ownerDashboard(venueId).then(setDashboard).catch((e) => setError(e.message));
  }, [venueId]);

  async function respond(bookingId, status) {
    await api.patchBooking(bookingId, status);
    const fresh = await api.ownerDashboard(venueId);
    setDashboard(fresh);
  }

  if (error) return <div className="max-w-5xl mx-auto px-5 py-10 text-sm text-gamosa">{error}</div>;
  if (!venues.length) return <div className="max-w-5xl mx-auto px-5 py-10 text-sm text-[#8A7F6C]">Loading…</div>;

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
        {dashboard?.venue.verified && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-paperDim text-teal">
            <BadgeCheck size={12} /> Live listing
          </span>
        )}
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

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="border rounded-md p-4 border-line">
      <Icon size={16} className="mb-2 text-gamosa" />
      <p className="font-mono text-xl text-ink">{value}</p>
      <p className="text-xs mt-0.5 text-[#8A7F6C]">{label}</p>
    </div>
  );
}
