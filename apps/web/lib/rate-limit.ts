/**
 * Fixed-window rate limits per client IP, in memory. Enough for one server
 * behind a reverse proxy, which sets X-Forwarded-For.
 */
import "server-only";
import { getDictionary, langFromRequest } from "./i18n";

const windows = new Map<string, { count: number; reset: number }>();

/** True if the request is allowed; counts it. */
export function allow(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  if (windows.size > 20_000) {
    for (const [k, w] of windows) if (w.reset <= now) windows.delete(k);
  }
  const w = windows.get(key);
  if (!w || w.reset <= now) {
    windows.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  w.count++;
  return w.count <= limit;
}

/**
 * The client's IP: the last X-Forwarded-For entry, which the reverse proxy in
 * front of the app appends. Earlier entries come from the client and can be forged.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

/** A 429 response when the IP went over `limit` requests in `windowMs` for this bucket, otherwise null. */
export function limitRequest(req: Request, bucket: string, limit: number, windowMs = 60_000): Response | null {
  if (allow(`${bucket}:${clientIp(req)}`, limit, windowMs)) return null;
  return Response.json({ error: getDictionary(langFromRequest(req)).api.tooMany }, { status: 429, headers: { "retry-after": String(Math.ceil(windowMs / 1000)) } });
}
