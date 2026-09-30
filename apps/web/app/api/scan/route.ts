import { NextResponse } from "next/server";
import { navigate, type LocateResult, type NavTarget, type Navigation, type OcrResult } from "@navtora/core";
import { OcrError, type OcrMeta } from "@navtora/ocr";
import { getDictionary, langFromRequest, type Dictionary } from "@/lib/i18n";
import { getLayout, getLocator } from "@/lib/locator";
import { getOcrProvider, ocrConfigError } from "@/lib/ocr";
import { isOcrModel } from "@/lib/models";
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
 * Transcribes a photo of a column and locates it in the Torah.
 * Form fields: image, model?, target? (JSON NavTarget), wpc? (words per column
 * learned for this sefer), lang?.
 * The image is never stored or logged; only timings and token counts are.
 */
export async function POST(req: Request): Promise<Response> {
  const t0 = Date.now();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with an image field." }, { status: 400 });
  }
  const t = getDictionary(langFromRequest(req, form.get("lang")));
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
  const model = isOcrModel(requestedModel) ? requestedModel : undefined;
  const target = parseTarget(form.get("target"));
  const wpcRaw = Number(form.get("wpc"));
  const learnedWpc = Number.isFinite(wpcRaw) && wpcRaw > 50 && wpcRaw < 2000 ? wpcRaw : null;

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const ocr = getOcrProvider(model);
    const { result, meta } = await ocr.recognize({ bytes, mime: file.type as "image/jpeg" | "image/png" | "image/webp" });
    const locator = getLocator();
    const locate = locator.locate(result);
    let navigation: Navigation | null = null;
    if (target && locate.status === "confident" && locate.best) {
      const lineStarts = locate.debug?.candidates[0]?.lineStarts;
      navigation = navigate(locate.best, target, { text: locator.text, layout: getLayout(), learnedWordsPerColumn: learnedWpc }, lineStarts);
    }
    // the client does not need the candidate details
    delete locate.debug;
    const body: ScanResponse = { locate, ocr: result, navigation, scroll: getScrollInfo(), meta: { ...meta, totalMs: Date.now() - t0 } };
    console.info(
      JSON.stringify({
        evt: "scan",
        status: locate.status,
        model: meta.model ?? ocr.name,
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
