import { NextResponse } from "next/server";
import { navigate, type LocateResult, type NavTarget, type Navigation, type OcrResult } from "@kore/core";
import type { OcrMeta } from "@kore/ocr";
import { getLayout, getLocator } from "@/lib/locator";
import { getOcrProvider } from "@/lib/ocr";
import { isOcrModel } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 6 * 1024 * 1024;
const MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface ScanResponse {
  locate: LocateResult;
  ocr: OcrResult;
  navigation: Navigation | null;
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

/**
 * Recibe una foto de la columna, la transcribe y la ubica en la Torá.
 * Campos: image (archivo), model (opcional), target (JSON opcional con el objetivo),
 * wpc (opcional: palabras por columna aprendidas en este sefer).
 * La imagen no se guarda ni se loguea: sólo se registran tiempos y tokens.
 */
export async function POST(req: Request): Promise<Response> {
  const t0 = Date.now();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Se esperaba multipart/form-data con un campo image." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Falta el campo image." }, { status: 400 });
  }
  if (!MIMES.has(file.type)) {
    return NextResponse.json({ error: `Formato no soportado: ${file.type || "desconocido"}.` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 6 MB. Reducila antes de enviarla." }, { status: 413 });
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
    // el detalle de candidatos no hace falta en el cliente
    delete locate.debug;
    const body: ScanResponse = { locate, ocr: result, navigation, meta: { ...meta, totalMs: Date.now() - t0 } };
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
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error(JSON.stringify({ evt: "scan_error", message }));
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
