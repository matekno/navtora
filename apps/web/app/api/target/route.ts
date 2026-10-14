import { NextResponse } from "next/server";
import { langFromRequest } from "@/lib/i18n";
import { limitRequest } from "@/lib/rate-limit";
import { listParashot, resolveTargets } from "@/lib/targets";
import type { TargetRequest } from "@/lib/target-types";

export const runtime = "nodejs";

/** Parashot with their aliyot, for the picker. */
export async function GET(): Promise<Response> {
  return NextResponse.json({ parashot: listParashot() });
}

/** Resolves a target request (see TargetRequest) to word positions. */
export async function POST(req: Request): Promise<Response> {
  const limited = limitRequest(req, "target", 120);
  if (limited) return limited;
  let body: TargetRequest;
  try {
    body = (await req.json()) as TargetRequest;
  } catch {
    return NextResponse.json({ targets: [], error: "Expected a JSON body." }, { status: 400 });
  }
  if (!body || !["aliyah", "verse", "today", "holidays"].includes(body.kind)) {
    return NextResponse.json({ targets: [], error: "kind must be aliyah, verse, today or holidays." }, { status: 400 });
  }
  if (body.kind === "holidays" && body.year !== undefined && !(body.year >= 5000 && body.year <= 6500)) {
    return NextResponse.json({ targets: [], error: "The Hebrew year must be between 5000 and 6500." }, { status: 400 });
  }
  if (body.kind === "verse" && !(body.book >= 1 && body.book <= 5 && body.chapter >= 1 && body.verse >= 1)) {
    return NextResponse.json({ targets: [], error: "Invalid verse reference." }, { status: 400 });
  }
  if (body.kind === "today" && body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ targets: [], error: "The date must be YYYY-MM-DD." }, { status: 400 });
  }
  try {
    const res = resolveTargets(body, langFromRequest(req, body.lang));
    return NextResponse.json(res, { status: res.error && res.targets.length === 0 ? 404 : 200 });
  } catch (err) {
    return NextResponse.json({ targets: [], error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
