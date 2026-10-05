import { NextResponse } from "next/server";
import { navigate, type LocateResult, type NavTarget, type Navigation, type OcrResult } from "@navtora/core";
import { OcrError, type OcrMeta } from "@navtora/ocr";
import { requireSession } from "@/lib/auth";
import { getDictionary, langFromRequest, type Dictionary } from "@/lib/i18n";
import { getLayout, getLocator } from "@/lib/locator";
import { getOcrProvider, ocrConfigError } from "@/lib/ocr";
import { isClaudeModel } from "@/lib/models";
import { getScrollInfo } from "@/lib/scroll-info";
import type { ScrollInfo } from "@/lib/target-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 6 * 1024 * 1024;
const MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface ScanResponse {
  locate: LocateResult;
  ocr: OcrResult;
  navigation: Navigation | null;
  scroll: ScrollInfo;
  meta: OcrMeta & { totalMs: number };
  /** whether a Claude model can read here, to offer it after a local reading */
  claude: boolean;
}

function parseTarget(raw: FormDataEntryValue | null): NavTarget | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const t = JSON.parse(raw) as Partial<NavTarget>;
    if (typeof t.word !== "number" || typeof t.label !== "string" || !t.ref) return null;
    return { word: t.word, label: t.label, ref: t.ref, ...(typeof t.endWord === "number" ? { endWord: t.endWord } : {}) };
  } catch {
    return null;
  }
}

/** User-facing message for an OCR failure. */
function describeError(err: unknown, t: Dictionary): string {
  if (err instanceof OcrError) {
    if (err.code === "refusal") return t.api.ocrRefusal(err.detail);
    if (err.code === "truncated") return t.api.ocrTruncated;
    return t.api.ocrBadFormat;
  }
  return err instanceof Error ? err.message : t.api.unknown;
}

/**
 * A transcription made on the phone by the local OCR. Only consonantal
 * Hebrew, spaces and `?` are accepted, within the size of a column.
 */
function parseLocalOcr(raw: string): OcrResult | null {
  if (raw.length > 20_000) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  const o = v as { lines?: unknown; lineCountVisible?: unknown };
  if (!Array.isArray(o.lines) || o.lines.length > 80) return null;
  const lines: OcrResult["lines"] = [];
  for (const l of o.lines as Array<{ text?: unknown; uncertain?: unknown; gapBefore?: unknown }>) {
    if (typeof l?.text !== "string" || l.text.length > 300 || !/^[\u05d0-\u05ea ?]*$/.test(l.text)) return null;
    const gap = l.gapBefore === "full" || l.gapBefore === "partial" ? l.gapBefore : "none";
    lines.push({ text: l.text, uncertain: l.uncertain === true, gapBefore: gap });
  }
  const visible = typeof o.lineCountVisible === "number" && o.lineCountVisible >= 0 && o.lineCountVisible < 200 ? Math.round(o.lineCountVisible) : lines.length;
  return { lines, lineCountVisible: visible };
}

/**
 * Locates a column in the Torah.
 * Form fields: either ocr (JSON transcription made on the phone by the local
 * OCR) and ocrMs, or image and model? (a Claude model reads it here); plus
 * target? (JSON NavTarget), wpc? (words per column learned for this sefer), lang?.
 * The image is never stored or logged; only timings and token counts are.
 */
export async function POST(req: Request): Promise<Response> {
  const denied = requireSession(req);
  if (denied) return denied;
  const t0 = Date.now();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with an image or ocr field." }, { status: 400 });
  }
  const t = getDictionary(langFromRequest(req, form.get("lang")));
  const target = parseTarget(form.get("target"));
  const wpcRaw = Number(form.get("wpc"));
  const learnedWpc = Number.isFinite(wpcRaw) && wpcRaw > 50 && wpcRaw < 2000 ? wpcRaw : null;

  let read: () => Promise<{ result: OcrResult; meta: OcrMeta }>;
  const localOcr = form.get("ocr");
  if (typeof localOcr === "string") {
    const result = parseLocalOcr(localOcr);
    if (!result) return NextResponse.json({ error: "The ocr field must be a JSON transcription of Hebrew lines." }, { status: 400 });
    const ms = Number(form.get("ocrMs"));
    const meta: OcrMeta = { provider: "local", model: "stam-crnn", ms: Number.isFinite(ms) && ms >= 0 && ms < 600_000 ? Math.round(ms) : 0 };
    read = async () => ({ result, meta });
  } else {
    const file = form.get("image");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image field." }, { status: 400 });
    }
    if (!MIMES.has(file.type)) {
      return NextResponse.json({ error: t.api.unsupported(file.type) }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: t.api.tooLarge }, { status: 413 });
    }
    if (ocrConfigError() === "missing-key") {
      return NextResponse.json({ error: t.api.missingKey }, { status: 503 });
    }
    const requestedModel = form.get("model");
    const model = isClaudeModel(requestedModel) ? requestedModel : undefined;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = file.type as "image/jpeg" | "image/png" | "image/webp";
    read = () => getOcrProvider(model).recognize({ bytes, mime });
  }

  try {
    const { result, meta } = await read();
    const locator = getLocator();
    const locate = locator.locate(result);
    let navigation: Navigation | null = null;
    if (target && locate.status === "confident" && locate.best) {
      const lineStarts = locate.debug?.candidates[0]?.lineStarts;
      navigation = navigate(locate.best, target, { text: locator.text, layout: getLayout(), learnedWordsPerColumn: learnedWpc }, lineStarts);
    }
    // the client does not need the candidate details
    delete locate.debug;
    const body: ScanResponse = { locate, ocr: result, navigation, scroll: getScrollInfo(), meta: { ...meta, totalMs: Date.now() - t0 + (meta.provider === "local" ? meta.ms : 0) }, claude: ocrConfigError() === null };
    console.info(
      JSON.stringify({
        evt: "scan",
        status: locate.status,
        model: meta.model ?? meta.provider,
        lines: result.lines.length,
        ocrMs: meta.ms,
        totalMs: body.meta.totalMs,
        inputTokens: meta.inputTokens,
        outputTokens: meta.outputTokens,
        column: locate.best?.standardColumn?.column ?? null,
        nav: navigation ? `${navigation.status}:${navigation.columns ?? "?"}` : null,
      }),
    );
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(JSON.stringify({ evt: "scan_error", message }));
    return NextResponse.json({ error: describeError(err, t) }, { status: 502 });
  }
}
