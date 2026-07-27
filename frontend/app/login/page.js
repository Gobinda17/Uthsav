"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { setSession } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result =
        mode === "login" ? await api.login(phone, password) : await api.register(phone, name, password);
      setSession(result.token, result.user);
      router.push(result.user.role === "ADMIN" ? "/admin" : "/owner");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-12">
      <h1 className="font-display text-2xl text-ink mb-1">
        {mode === "login" ? "Venue owner / admin login" : "List your venue"}
      </h1>
      <p className="text-sm mb-6 text-[#8A7F6C]">
        {mode === "login"
          ? "Log in to manage your venues and booking requests."
          : "Create an owner account to start listing your venue."}
      </p>

      <form onSubmit={submit}>
        {mode === "register" && (
          <>
            <label className="text-sm font-medium block mb-2 text-ink">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anup Baruah"
              className="w-full border rounded px-3 py-2 text-sm mb-4 border-line outline-none"
            />
          </>
        )}

        <label className="text-sm font-medium block mb-2 text-ink">Phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9000000001"
          className="w-full border rounded px-3 py-2 text-sm mb-1 border-line outline-none"
        />
        <p className="text-xs mb-4 text-[#8A7F6C]">+91 is added automatically</p>

        <label className="text-sm font-medium block mb-2 text-ink">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full border rounded px-3 py-2 text-sm mb-6 border-line outline-none"
        />

        {error && <p className="text-sm text-gamosa mb-4">{error}</p>}

        <button
          disabled={submitting || !phone || !password || (mode === "register" && !name)}
          className="w-full py-2.5 rounded text-sm font-medium bg-gamosa text-white disabled:opacity-60"
        >
          {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
        className="w-full text-center text-sm mt-4 text-teal"
      >
        {mode === "login" ? "New venue owner? Create an account" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
