const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
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
  ownerVenues: (ownerId) => request(`/api/owner/venues${ownerId ? `?ownerId=${ownerId}` : ""}`),
  ownerDashboard: (venueId) => request(`/api/owner/venues/${venueId}/dashboard`),
};

export function inr(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}
