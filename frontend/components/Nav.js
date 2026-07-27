"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

export default function Nav() {
  const pathname = usePathname();
  const isOwner = pathname?.startsWith("/owner");

  return (
    <div className="sticky top-0 z-30 bg-ink">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center rotate-45 bg-gold">
            <span className="-rotate-45 font-display text-ink font-semibold">উ</span>
          </div>
          <span className="text-paper font-display text-xl tracking-wide">Uthsav</span>
        </Link>

        <div className="hidden sm:flex items-center gap-1 text-sm text-paperDim">
          <MapPin size={14} />
          <span>Guwahati, Assam</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-white/10">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !isOwner ? "bg-gold text-ink font-semibold" : "text-paperDim"
            }`}
          >
            Find a venue
          </Link>
          <Link
            href="/owner"
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              isOwner ? "bg-gold text-ink font-semibold" : "text-paperDim"
            }`}
          >
            List your venue
          </Link>
        </div>
      </div>
    </div>
  );
}
