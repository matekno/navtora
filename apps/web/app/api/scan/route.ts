import { NextResponse } from "next/server";
import { navigate, type LocateResult, type NavTarget, type Navigation, type OcrResult } from "@navtora/core";
import type { OcrMeta } from "@navtora/ocr";
import { langFromRequest } from "@/lib/i18n";
import { getLayout, getLocator } from "@/lib/locator";
import { limitRequest } from "@/lib/rate-limit";
import { getScrollInfo } from "@/lib/scroll-info";
import { parseClientId, recordScan } from "@/lib/stats";
import type { ScrollInfo } from "@/lib/target-types";

export const runtime = "nodejs";

export interface ScanResponse {
  locate: LocateResult;
  ocr: OcrResult;
  navigation: Navigation | null;
  scroll: ScrollInfo;
  meta: OcrMeta & { totalMs: number };
  /** to attach feedback to this scan; null when the server isn't counting */
  scanId: string | null;
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
    if (typeof l?.text !== "string" || l.text.length > 300 || !/^[א-ת ?]*$/.test(l.text)) return null;
    const gap = l.gapBefore === "full" || l.gapBefore === "partial" ? l.gapBefore : "none";
    lines.push({ text: l.text, uncertain: l.uncertain === true, gapBefore: gap });
  }
  const visible = typeof o.lineCountVisible === "number" && o.lineCountVisible >= 0 && o.lineCountVisible < 200 ? Math.round(o.lineCountVisible) : lines.length;
  return { lines, lineCountVisible: visible };
}

/**
 * Locates a column in the Torah from the transcription the phone made.
 * Form fields: ocr (JSON transcription), ocrMs, target? (JSON NavTarget),
 * wpc? (words per column learned for this sefer), client? (anonymous id), lang?.
 * The photo never reaches this route.
 */
export async function POST(req: Request): Promise<Response> {
  const limited = limitRequest(req, "scan", 120);
  if (limited) return limited;
  const t0 = Date.now();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with an ocr field." }, { status: 400 });
  }
  const lang = langFromRequest(req, form.get("lang"));
  const client = parseClientId(form.get("client"));
  const target = parseTarget(form.get("target"));
  const wpcRaw = Number(form.get("wpc"));
  const learnedWpc = Number.isFinite(wpcRaw) && wpcRaw > 50 && wpcRaw < 2000 ? wpcRaw : null;

  const raw = form.get("ocr");
  const result = typeof raw === "string" ? parseLocalOcr(raw) : null;
  if (!result) return NextResponse.json({ error: "The ocr field must be a JSON transcription of Hebrew lines." }, { status: 400 });
  const ms = Number(form.get("ocrMs"));
  const meta: OcrMeta = { provider: "local", model: "stam-crnn", ms: Number.isFinite(ms) && ms >= 0 && ms < 600_000 ? Math.round(ms) : 0 };

  const locator = getLocator();
  const locate = locator.locate(result);
  let navigation: Navigation | null = null;
  if (target && locate.status === "confident" && locate.best) {
    const lineStarts = locate.debug?.candidates[0]?.lineStarts;
    navigation = navigate(locate.best, target, { text: locator.text, layout: getLayout(), learnedWordsPerColumn: learnedWpc }, lineStarts);
  }
  // the client does not need the candidate details
  delete locate.debug;
  const totalMs = Date.now() - t0 + meta.ms;
  const best = locate.best;
  const nav = navigation ? (navigation.status === "here" ? "here" : String(navigation.columns ?? "?")) : null;
  const scanId = recordScan({
    client,
    kind: "camera",
    status: locate.status,
    lines: result.lines.length,
    ocrMs: meta.ms,
    totalMs,
    book: best?.book.n ?? null,
    parasha: best?.parashot[0]?.n ?? null,
    column: best?.standardColumn?.column ?? null,
    nav,
    target: target?.label ?? null,
    text: result.lines.map((l) => l.text).join("\n"),
    lang,
  });
  const body: ScanResponse = { locate, ocr: result, navigation, scroll: getScrollInfo(), meta: { ...meta, totalMs }, scanId };
  console.info(
    JSON.stringify({
      evt: "scan",
      status: locate.status,
      lines: result.lines.length,
      ocrMs: meta.ms,
      totalMs,
      column: best?.standardColumn?.column ?? null,
      nav,
    }),
  );
  return NextResponse.json(body);
}
