"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Box, Star, MapPin, Users, BadgeCheck, Shield, MessageCircle,
  ArrowRight, Calendar, Check, X, IndianRupee, Wifi, Car, Utensils, Music, Wind,
} from "lucide-react";
import { api, inr } from "../../../lib/api";
import GamosaRule from "../../../components/GamosaRule";

const AMENITY_ICONS = {
  Parking: Car, WiFi: Wifi, Catering: Utensils, "Sound System": Music, AC: Wind, Security: Shield,
};

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false); // toggles the booking panel

  useEffect(() => {
    Promise.all([api.getVenue(id), api.getAvailability(id)])
      .then(([v, a]) => { setVenue(v); setAvailability(a); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="max-w-2xl mx-auto px-5 py-10 text-sm text-gamosa">{error}</div>;
  if (!venue) return <div className="max-w-2xl mx-auto px-5 py-10 text-sm text-[#8A7F6C]">Loading venue…</div>;

  if (booking) {
    return (
      <BookingFlow
        venue={venue}
        availability={availability}
        onCancel={() => setBooking(false)}
        onDone={(newBookingId) => router.push(`/venue/${id}/confirmed?booking=${newBookingId}`)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <button onClick={() => router.push("/")} className="flex items-center gap-1 text-sm mb-4 text-teal">
        <ChevronLeft size={16} /> Back to results
      </button>

      <div
        className="h-72 rounded-md relative overflow-hidden mb-4"
        style={{ background: "linear-gradient(135deg, #3E6656, #C0932E)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 py-4 rounded bg-ink/55">
            <Box size={22} className="mx-auto mb-2 text-gold" />
            <p className="text-sm text-paper">Interactive 3D walkthrough</p>
            <p className="text-xs mt-0.5 text-paperDim">
              {venue.threeDUrl ? "Scanned with Polycam · tap to explore" : "Walkthrough not uploaded yet for this venue"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl text-ink">{venue.name}</h1>
              <p className="flex items-center gap-1 text-sm mt-1 text-[#6B6152]">
                <MapPin size={13} /> {venue.area}
              </p>
            </div>
            {venue.verified && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs shrink-0 bg-paperDim text-teal">
                <BadgeCheck size={13} /> Verified owner
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-ink">
            <span className="flex items-center gap-1 text-gamosa">
              <Star size={14} fill="#A63A2E" strokeWidth={0} /> {venue.rating} ({venue.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> {venue.capacity[0]}–{venue.capacity[1]} guests
            </span>
          </div>

          <p className="text-sm mt-4 text-[#6B6152]">{venue.description}</p>

          <GamosaRule className="my-5" />

          <h3 className="font-display text-lg mb-2 text-ink">Amenities</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {venue.amenities.map((a) => {
              const Icon = AMENITY_ICONS[a] || Wind;
              return (
                <span key={a} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded bg-paperDim text-ink">
                  <Icon size={14} /> {a}
                </span>
              );
            })}
          </div>

          <h3 className="font-display text-lg mb-2 text-ink">Suited for</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {venue.eventTypes.map((t) => (
              <span key={t} className="text-sm px-3 py-1 rounded-full border border-line text-ink">{t}</span>
            ))}
          </div>

          <h3 className="font-display text-lg mb-2 text-ink">Cancellation policy</h3>
          <p className="text-sm text-[#6B6152]">
            Full refund 30+ days before the event · 50% refund 15–30 days before · 25% refund
            7–15 days before · non-refundable within 7 days.
          </p>
        </div>

        <div>
          <div className="border rounded-md p-5 sticky top-20 border-line bg-paper">
            <p className="text-xs uppercase tracking-wide text-[#8A7F6C]">Starting from</p>
            <p className="font-mono text-2xl font-medium text-ink">{inr(venue.price)}</p>
            <p className="text-xs mt-0.5 text-[#8A7F6C]">per event, full-day slot</p>

            <button
              onClick={() => setBooking(true)}
              className="w-full mt-4 py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 bg-gamosa text-white"
            >
              Check availability &amp; book <ArrowRight size={15} />
            </button>
            <button className="w-full mt-2 py-2.5 rounded text-sm border flex items-center justify-center gap-2 border-line text-ink">
              <MessageCircle size={15} /> Message venue owner
            </button>
            <p className="text-xs mt-3 flex items-center gap-1 text-[#8A7F6C]">
              <Shield size={12} /> Contact stays in-app until booking is confirmed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingFlow({ venue, availability, onCancel, onDone }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(null);
  const [eventType, setEventType] = useState(venue.eventTypes[0]);
  const [guests, setGuests] = useState(venue.capacity[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const token = Math.round(venue.price * (venue.tokenPercent / 100));

  async function submitBooking() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.createBooking({
        venueId: venue.id,
        eventType,
        eventDate: date,
        guestCount: guests,
        customer: { phone, name },
      });
      onDone(result.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-ink">Book {venue.name}</h2>
        <button onClick={onCancel} className="text-[#8A7F6C]"><X size={20} /></button>
      </div>

      <div className="flex items-center gap-2 mb-8 text-xs text-[#8A7F6C]">
        {["Date & event", "Your details", "Payment"].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: step > i + 1 ? "#28483E" : step === i + 1 ? "#A63A2E" : "#F0EADC",
                  color: step >= i + 1 ? "#fff" : "#8A7F6C",
                }}
              >
                {step > i + 1 ? <Check size={11} /> : i + 1}
              </div>
              <span style={{ color: step === i + 1 ? "#1C2620" : "#8A7F6C" }}>{label}</span>
            </div>
            {i < 2 && <div className="flex-1 h-px bg-line" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">Select a date</label>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {availability.map((slot) => {
              const label = new Date(slot.date).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <button
                  key={slot.date}
                  disabled={!slot.available}
                  onClick={() => setDate(slot.date)}
                  className="flex items-center justify-between px-3 py-2.5 rounded text-sm border"
                  style={{
                    borderColor: date === slot.date ? "#A63A2E" : "#DDD3BC",
                    background: date === slot.date ? "#FBEDE9" : slot.available ? "transparent" : "#F0EADC",
                    color: slot.available ? "#1C2620" : "#B0A48C",
                    cursor: slot.available ? "pointer" : "not-allowed",
                  }}
                >
                  <span className="flex items-center gap-2"><Calendar size={14} /> {label}</span>
                  <span style={{ color: slot.available ? "#28483E" : "#A63A2E" }}>
                    {slot.available ? "Available" : "Booked"}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="text-sm font-medium block mb-2 text-ink">Event type</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {venue.eventTypes.map((t) => (
              <button
                key={t}
                onClick={() => setEventType(t)}
                className="px-3 py-1.5 rounded-full text-sm border"
                style={{
                  borderColor: eventType === t ? "#A63A2E" : "#DDD3BC",
                  background: eventType === t ? "#A63A2E" : "transparent",
                  color: eventType === t ? "#fff" : "#1C2620",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            disabled={!date}
            onClick={() => setStep(2)}
            className="w-full py-2.5 rounded text-sm font-medium"
            style={{ background: date ? "#A63A2E" : "#DDD3BC", color: date ? "#fff" : "#8A7F6C" }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="text-sm font-medium block mb-2 text-ink">Your name</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rima Baruah"
            className="w-full border rounded px-3 py-2 text-sm mb-4 border-line outline-none"
          />
          <label className="text-sm font-medium block mb-2 text-ink">Phone number</label>
          <input
            value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="9000000001"
            className="w-full border rounded px-3 py-2 text-sm mb-1 border-line outline-none"
          />
          <p className="text-xs mb-4 text-[#8A7F6C]">+91 is added automatically</p>
          <label className="text-sm font-medium block mb-2 text-ink">Expected guest count</label>
          <input
            type="range" min={venue.capacity[0]} max={venue.capacity[1]} value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full mb-2"
          />
          <p className="text-sm mb-6 text-ink">{guests} guests</p>

          <div className="border rounded-md p-4 mb-6 border-line bg-paperDim">
            <p className="text-sm flex items-center gap-1.5 text-teal"><Shield size={14} /> Refund protection</p>
            <p className="text-xs mt-1 text-[#6B6152]">
              Your token is held in escrow until the venue owner confirms. Cancel 30+ days out for a full refund.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded text-sm border border-line text-ink">Back</button>
            <button
              disabled={!name || !phone}
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded text-sm font-medium"
              style={{ background: name && phone ? "#A63A2E" : "#DDD3BC", color: name && phone ? "#fff" : "#8A7F6C" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="border rounded-md p-4 mb-4 border-line">
            <Row label="Venue total" value={inr(venue.price)} />
            <Row label={`Token to book (${venue.tokenPercent}%)`} value={inr(token)} />
            <div className="h-px my-2 bg-line" />
            <Row label="Pay now" value={inr(token)} bold accent />
            <p className="text-xs mt-2 text-[#8A7F6C]">
              Balance {inr(venue.price - token)} payable directly to venue as per your agreement.
            </p>
          </div>

          <div className="border rounded-md p-4 mb-4 flex items-center gap-3 border-line">
            <IndianRupee size={18} className="text-teal" />
            <div className="flex-1">
              <p className="text-sm text-ink">Razorpay Checkout</p>
              <p className="text-xs text-[#8A7F6C]">UPI, cards, netbanking — simulated for demo</p>
            </div>
          </div>

          {error && <p className="text-sm text-gamosa mb-4">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded text-sm border border-line text-ink">Back</button>
            <button
              disabled={submitting}
              onClick={submitBooking}
              className="flex-1 py-2.5 rounded text-sm font-medium bg-gamosa text-white disabled:opacity-60"
            >
              {submitting ? "Processing…" : `Pay ${inr(token)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div className={`flex justify-between text-sm py-1 ${bold ? "font-medium" : ""}`}>
      <span className={accent ? "text-ink" : "text-[#6B6152]"}>{label}</span>
      <span className={`font-mono ${accent ? "text-gamosa" : "text-ink"}`}>{value}</span>
    </div>
  );
}
