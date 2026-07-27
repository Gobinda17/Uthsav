"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, ChevronDown, ShieldCheck, LogOut } from "lucide-react";
import { getSession, clearSession } from "../lib/auth";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSessionState] = useState(undefined);
  const isOwnerSession = session && ["VENUE_OWNER", "ADMIN"].includes(session.user.role);
  const isOwner = pathname?.startsWith("/owner") || (!isOwnerSession && pathname === "/login");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setSessionState(getSession());
    const onChange = () => setSessionState(getSession());
    window.addEventListener("uthsav-session-changed", onChange);
    return () => window.removeEventListener("uthsav-session-changed", onChange);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function logout() {
    setMenuOpen(false);
    clearSession();
    router.push("/");
  }

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

        <div className="flex items-center gap-4">
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
              href={isOwnerSession ? "/owner" : "/login"}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                isOwner ? "bg-gold text-ink font-semibold" : "text-paperDim"
              }`}
            >
              List your venue
            </Link>
          </div>

          <div className="hidden sm:block text-sm">
            {session === undefined ? null : session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-paperDim"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-white/10 text-paper"
                  >
                    {session.user.name?.[0]?.toUpperCase() || "?"}
                  </span>
                  {session.user.name}
                  <ChevronDown size={14} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border border-line bg-paper shadow-lg overflow-hidden z-40">
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-paperDim"
                      >
                        <ShieldCheck size={14} /> Admin panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-paperDim text-left"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-gold">Log in</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
