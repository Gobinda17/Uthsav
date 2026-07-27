"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { api } from "../../../../lib/api";
import GamosaRule from "../../../../components/GamosaRule";

export default function ConfirmedPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("booking");
  const [venue, setVenue] = useState(null);

  useEffect(() => {
    api.getVenue(id).then(setVenue).catch(() => {});
  }, [id]);

  return (
    <div className="max-w-md mx-auto px-5 py-16 text-center">
      <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 bg-teal">
        <Check size={26} color="#fff" />
      </div>
      <h2 className="font-display text-2xl mb-2 text-ink">Request sent</h2>
      <p className="text-sm mb-2 text-[#6B6152]">
        {venue ? venue.name : "The venue"} has been notified. Owners typically confirm within 6
        hours — you&rsquo;ll get an update here and by SMS.
      </p>
      {bookingId && (
        <p className="text-xs mb-6 text-[#8A7F6C] font-mono">Booking ref: {bookingId.slice(0, 8)}</p>
      )}
      <GamosaRule className="justify-center mb-6" />
      <button
        onClick={() => router.push("/")}
        className="px-5 py-2.5 rounded text-sm font-medium bg-gamosa text-white"
      >
        Back to venues
      </button>
    </div>
  );
}
