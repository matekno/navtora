import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, adminEnabled, checkPassword, isHttps, sessionToken } from "@/lib/auth";
import { getDictionary, langFromRequest } from "@/lib/i18n";
import { limitRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Admin sign-in. Body: { password, lang? }. Sets the session cookie on success. */
export async function POST(req: Request): Promise<Response> {
  // slows down password guessing
  const limited = limitRequest(req, "login", 10, 15 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as { password?: unknown; lang?: unknown };
  const t = getDictionary(langFromRequest(req, body.lang));
  if (!adminEnabled()) return NextResponse.json({ error: t.login.disabled }, { status: 403 });
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    return NextResponse.json({ error: t.login.wrong }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken()!, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** Signs out. */
export async function DELETE(): Promise<Response> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
