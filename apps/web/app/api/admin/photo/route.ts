import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";
import { photoPath } from "@/lib/db";
import { feedbackPhoto } from "@/lib/stats";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/** A photo sent with feedback: ?id=<feedback id>. Add &download=1 to save it. */
export async function GET(req: Request): Promise<Response> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const params = new URL(req.url).searchParams;
  const photo = feedbackPhoto(params.get("id") ?? "");
  if (!photo) return new Response("Not found", { status: 404 });
  const name = path.basename(photo);
  try {
    const bytes = await fs.readFile(photoPath(name));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": TYPES[path.extname(name)] ?? "application/octet-stream",
        "cache-control": "private, max-age=3600",
        ...(params.get("download") ? { "content-disposition": `attachment; filename="${name}"` } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
