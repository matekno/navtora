import { NextResponse } from "next/server";
import { langFromRequest } from "@/lib/i18n";
import { limitRequest } from "@/lib/rate-limit";
import { parseClientId, touchClient } from "@/lib/stats";

export const runtime = "nodejs";

/** The app was opened. Body: { client, lang? }. Counts the anonymous client as active today. */
export async function POST(req: Request): Promise<Response> {
  const limited = limitRequest(req, "hello", 60);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as { client?: unknown; lang?: unknown };
  touchClient(parseClientId(body.client), langFromRequest(req, body.lang));
  return NextResponse.json({ ok: true });
}
