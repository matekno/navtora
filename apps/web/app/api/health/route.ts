import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** For the container's healthcheck. The app works without the database, so it's reported, not required. */
export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true, db: getDb() !== null });
}
