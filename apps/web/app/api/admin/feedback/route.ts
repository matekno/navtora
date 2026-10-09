import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { photoPath } from "@/lib/db";
import { deleteFeedback } from "@/lib/stats";

export const runtime = "nodejs";

/** Deletes feedback and its photo: ?id= */
export async function DELETE(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const { deleted, photo } = deleteFeedback(id);
  if (!deleted) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (photo) await fs.rm(photoPath(photo), { force: true });
  return NextResponse.json({ ok: true });
}
