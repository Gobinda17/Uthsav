import Link from "next/link";
import { MapPin, Star, Users, Box, BadgeCheck } from "lucide-react";
import { inr } from "../lib/api";

const PALETTES = [
  ["#3E6656", "#C0932E"],
  ["#A63A2E", "#1C2620"],
  ["#C0932E", "#28483E"],
  ["#28483E", "#A63A2E"],
  ["#1C2620", "#C0932E"],
  ["#3E6656", "#A63A2E"],
];

export default function VenueCard({ v, index = 0 }) {
  const palette = PALETTES[index % PALETTES.length];

  return (
    <Link href={`/venue/${v.id}`} className="text-left group block">
      <div
        className="h-40 rounded-md relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)",
          }}
        />
        {v.verified && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-paper/95 text-teal">
            <BadgeCheck size={12} /> Verified
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-ink/75 text-paper">
          <Box size={12} /> 3D walkthrough
        </div>
      </div>

      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base leading-tight text-ink group-hover:opacity-70 transition-opacity">
            {v.name}
          </h3>
          <div className="flex items-center gap-0.5 text-sm shrink-0 text-gamosa">
            <Star size={13} fill="#A63A2E" strokeWidth={0} /> {v.rating}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs mt-1 text-[#6B6152]">
          <MapPin size={11} /> {v.area}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-[#6B6152]">
          <span className="flex items-center gap-1">
            <Users size={11} /> {v.capacity[0]}–{v.capacity[1]} guests
          </span>
          <span className="font-mono font-medium text-ink">from {inr(v.price)}</span>
        </div>
      </div>
    </Link>
  );
}
