/**
 * An anonymous id made on the phone, to count people without accounts. It is
 * random, kept in localStorage and sent with scans and feedback; nothing ties
 * it to a person.
 */
const KEY = "navtora.client.v1";
let cached: string | null = null;

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

export function getClientId(): string {
  if (cached) return cached;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && /^[A-Za-z0-9_-]{8,64}$/.test(saved)) return (cached = saved);
    cached = randomId();
    window.localStorage.setItem(KEY, cached);
  } catch {
    // private mode: a fresh id per page load
    cached ??= randomId();
  }
  return cached;
}
