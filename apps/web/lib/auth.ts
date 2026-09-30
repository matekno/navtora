/**
 * Optional admin password for a hosted copy. When ADMIN_PASSWORD is set, the
 * app pages and the API require a session cookie; when it isn't, everything
 * is open, which is what you want when running it locally.
 *
 * The cookie holds an HMAC keyed by the password, so changing the password
 * signs everyone out.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { readCookie } from "./cookies";
import { getDictionary, langFromRequest } from "./i18n";

export const SESSION_COOKIE = "navtora_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180;

function password(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(key: string): string {
  return createHmac("sha256", key).update("navtora-admin-session").digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function authEnabled(): boolean {
  return password() !== null;
}

export function sessionToken(): string | null {
  const pw = password();
  return pw ? sign(pw) : null;
}

export function checkPassword(input: string): boolean {
  const pw = password();
  return pw !== null && safeEqual(sign(input), sign(pw));
}

export function isAuthorized(cookie: string | undefined): boolean {
  const token = sessionToken();
  return token === null || (cookie !== undefined && safeEqual(cookie, token));
}

/** For API routes: a 401 response when the request has no valid session, otherwise null. */
export function requireSession(req: Request): Response | null {
  if (isAuthorized(readCookie(req, SESSION_COOKIE))) return null;
  return Response.json({ error: getDictionary(langFromRequest(req)).api.unauthorized }, { status: 401 });
}
