const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "uthsav_token";

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listVenues: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/venues${qs ? `?${qs}` : ""}`);
  },
  getVenue: (id) => request(`/api/venues/${id}`),
  getAvailability: (id) => request(`/api/venues/${id}/availability`),
  createBooking: (payload) =>
    request(`/api/bookings`, { method: "POST", body: JSON.stringify(payload) }),
  patchBooking: (id, status) =>
    request(`/api/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  login: (phone, password) =>
    request(`/api/auth/login`, { method: "POST", body: JSON.stringify({ phone, password }) }),
  register: (phone, name, password) =>
    request(`/api/auth/register`, { method: "POST", body: JSON.stringify({ phone, name, password }) }),
  me: () => request(`/api/auth/me`),

  ownerVenues: () => request(`/api/owner/venues`),
  ownerDashboard: (venueId) => request(`/api/owner/venues/${venueId}/dashboard`),
  createVenue: (payload) =>
    request(`/api/owner/venues`, { method: "POST", body: JSON.stringify(payload) }),
  updateVenue: (id, patch) =>
    request(`/api/owner/venues/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  adminVenues: () => request(`/api/admin/venues`),
  adminUpdateVenue: (id, patch) =>
    request(`/api/admin/venues/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  adminBookings: () => request(`/api/admin/bookings`),
};

export function inr(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}
