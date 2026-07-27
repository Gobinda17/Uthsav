// Accepts "9000000001", "919000000001" or "+919000000001" and normalizes to
// the "+91XXXXXXXXXX" form stored on User.phone, so +91 isn't mandatory to type.
function normalizePhone(raw) {
  if (!raw) return raw;
  const trimmed = raw.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (/^91\d{10}$/.test(trimmed)) return `+${trimmed}`;
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  return trimmed;
}

module.exports = { normalizePhone };
