import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { photoPath, photosDir } from "@/lib/db";
import { getDictionary, langFromRequest } from "@/lib/i18n";
import { allow, clientIp, limitRequest } from "@/lib/rate-limit";
import { FEEDBACK_REASONS, VOTES, feedbackExists, newId, parseClientId, recordFeedback, scanExists, updateFeedback, type FeedbackReason, type Vote } from "@/lib/stats";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const PHOTO_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function pick<T extends string>(v: FormDataEntryValue | null, options: readonly T[]): T | null {
  return typeof v === "string" && (options as readonly string[]).includes(v) ? (v as T) : null;
}

function parseId(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(v) ? v : null;
}

/**
 * Feedback on a scan. Form fields: client, lang?, and either
 *   scanId?, vote? (up | down), reason?, comment?, photo?  to leave feedback, or
 *   id, reason?, comment?, photo?                          to add details to feedback the same client left.
 * The photo is only ever sent here when the person ticks the box, and is kept
 * to train the reader.
 */
export async function POST(req: Request): Promise<Response> {
  const limited = limitRequest(req, "feedback", 20);
  if (limited) return limited;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }
  const lang = langFromRequest(req, form.get("lang"));
  const t = getDictionary(lang);
  const client = parseClientId(form.get("client"));
  const id = parseId(form.get("id"));
  const vote: Vote | null = pick(form.get("vote"), VOTES);
  const reason: FeedbackReason | null = pick(form.get("reason"), FEEDBACK_REASONS);
  const rawComment = form.get("comment");
  const comment = typeof rawComment === "string" && rawComment.trim() ? rawComment.trim().slice(0, 1000) : null;

  if (id && !feedbackExists(id, client)) return NextResponse.json({ error: "Unknown feedback." }, { status: 404 });
  const feedbackId = id ?? newId();

  let photo: string | null = null;
  const file = form.get("photo");
  if (file instanceof Blob && file.size > 0) {
    const ext = PHOTO_EXT[file.type];
    if (!ext) return NextResponse.json({ error: t.api.unsupported(file.type) }, { status: 415 });
    if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: t.api.tooLarge }, { status: 413 });
    if (!allow(`photo:${clientIp(req)}`, 10, 60 * 60_000)) return NextResponse.json({ error: t.api.tooMany }, { status: 429 });
    try {
      await fs.mkdir(photosDir(), { recursive: true });
      photo = `${feedbackId}.${ext}`;
      await fs.writeFile(photoPath(photo), new Uint8Array(await file.arrayBuffer()));
    } catch (err) {
      photo = null;
      console.error(JSON.stringify({ evt: "photo_error", message: (err as Error).message }));
    }
  }

  if (id) {
    updateFeedback(id, client, { reason, comment, photo });
  } else {
    const scanRaw = parseId(form.get("scanId"));
    const scan = scanRaw && scanExists(scanRaw) ? scanRaw : null;
    if (!vote && !reason && !comment && !photo) return NextResponse.json({ error: "Empty feedback." }, { status: 400 });
    if (!recordFeedback({ scan, client, vote, reason, comment, photo, lang }, feedbackId)) {
      if (photo) await fs.rm(photoPath(photo), { force: true });
      return NextResponse.json({ error: t.feedback.error }, { status: 503 });
    }
  }
  console.info(JSON.stringify({ evt: "feedback", vote, reason, photo: photo !== null, update: id !== null }));
  return NextResponse.json({ id: feedbackId });
}
