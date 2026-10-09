import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addDedication, deleteDedication, periodFor } from "@/lib/dedications";
import { langFromRequest } from "@/lib/i18n";

export const runtime = "nodejs";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Adds a dedication. Body: { kind: "week" | "jag", key, name, message? } for a
 * period from the calendar, or { kind: "custom", start, end, name, message? }.
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const message = typeof body.message === "string" && body.message.trim() ? body.message.trim().slice(0, 300) : null;
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });
  let kind: "week" | "jag" | "custom";
  let key: string | null = null;
  let start: string;
  let end: string;
  if (body.kind === "custom") {
    if (typeof body.start !== "string" || typeof body.end !== "string" || !DAY.test(body.start) || !DAY.test(body.end) || body.end < body.start) {
      return NextResponse.json({ error: "start and end must be dates, end not before start." }, { status: 400 });
    }
    kind = "custom";
    start = body.start;
    end = body.end;
  } else {
    const period = typeof body.kind === "string" && typeof body.key === "string" ? periodFor(body.kind, body.key, langFromRequest(req, body.lang)) : null;
    if (!period) return NextResponse.json({ error: "Unknown week or jag." }, { status: 400 });
    ({ kind, key, start, end } = period);
  }
  const id = addDedication({ kind, key, start, end, name, message });
  if (id === null) return NextResponse.json({ error: "The database is not available." }, { status: 503 });
  return NextResponse.json({ id });
}

/** Deletes a dedication: ?id= */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id is required." }, { status: 400 });
  return deleteDedication(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
