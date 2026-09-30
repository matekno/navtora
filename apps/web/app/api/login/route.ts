import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, authEnabled, checkPassword, sessionToken } from "@/lib/auth";
import { getDictionary, langFromRequest } from "@/lib/i18n";

export const runtime = "nodejs";

/** Body: { password, lang? }. Sets the session cookie on success. */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown; lang?: unknown };
  if (!authEnabled()) return NextResponse.json({ ok: true });
  if (typeof body.password !== "string" || !checkPassword(body.password)) {
    const t = getDictionary(langFromRequest(req, body.lang));
    return NextResponse.json({ error: t.login.wrong }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
