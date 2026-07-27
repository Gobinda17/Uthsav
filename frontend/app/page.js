"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import VenueCard from "../components/VenueCard";
import GamosaRule from "../components/GamosaRule";

const EVENT_TYPES = ["Wedding", "Reception", "Corporate", "Birthday", "Community", "Religious"];

export default function DiscoverPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (activeType !== "All") params.type = activeType;
    if (q.trim()) params.q = q.trim();

    api
      .listVenues(params)
      .then(setVenues)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeType, q]);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-ink">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #C0932E 0, #C0932E 1px, transparent 1px, transparent 22px)",
          }}
        />
        <div className="max-w-6xl mx-auto px-5 pt-14 pb-10 relative">
          <p className="text-xs uppercase mb-3 tracking-[0.14em] text-gold">
            Assam&rsquo;s venue marketplace
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] max-w-xl text-paper">
            Find the venue.
            <br />
            See it in 3D.
            <br />
            Book it today.
          </h1>
          <p className="mt-4 max-w-md text-sm text-paperDim">
            From namghar halls to riverside banquets — every venue in one place, with real
            availability and a walkthrough before you visit.
          </p>
          <div className="mt-6 flex items-center gap-2 max-w-lg bg-white rounded-md p-1.5">
            <Search size={16} className="ml-2 text-[#8A7F6C]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search venue or area — try 'Fancy Bazar'"
              className="flex-1 outline-none text-sm py-1.5 bg-transparent text-ink"
            />
          </div>
        </div>
        <GamosaRule className="justify-center pb-0" />
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-5 pt-6 flex flex-wrap gap-2">
        {["All", ...EVENT_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className="px-3 py-1.5 rounded-full text-sm border transition-colors"
            style={{
              borderColor: activeType === t ? "#A63A2E" : "#DDD3BC",
              background: activeType === t ? "#A63A2E" : "transparent",
              color: activeType === t ? "#fff" : "#1C2620",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-5 py-6">
        {error && (
          <div className="text-sm px-4 py-3 rounded-md mb-4 bg-[#F3E4E0] text-gamosa">
            Couldn&rsquo;t reach the API at{" "}
            <code className="font-mono">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}</code>
            . Is the backend running? ({error})
          </div>
        )}

        {loading ? (
          <p className="text-sm py-10 text-center text-[#8A7F6C]">Loading venues…</p>
        ) : (
          <>
            <p className="text-sm mb-4 text-[#6B6152]">
              {venues.length} venues{activeType !== "All" ? ` for ${activeType.toLowerCase()}` : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {venues.map((v, i) => (
                <VenueCard key={v.id} v={v} index={i} />
              ))}
              {venues.length === 0 && !error && (
                <p className="col-span-full text-sm py-10 text-center text-[#8A7F6C]">
                  No venues match yet — try a different filter.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
