import { NextResponse } from "next/server";
import type { LocateResult, OcrResult } from "@kore/core";
import type { OcrMeta } from "@kore/ocr";
import { getLocator } from "@/lib/locator";
import { getOcrProvider } from "@/lib/ocr";
import { isOcrModel } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 6 * 1024 * 1024;
const MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface ScanResponse {
  locate: LocateResult;
  ocr: OcrResult;
  meta: OcrMeta & { totalMs: number };
}

/**
 * Recibe una foto de la columna, la transcribe y la ubica en la Torá.
 * Campos: image (archivo) y model (opcional: claude-opus-5 | claude-sonnet-5).
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

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const ocr = getOcrProvider(model);
    const { result, meta } = await ocr.recognize({ bytes, mime: file.type as "image/jpeg" | "image/png" | "image/webp" });
    const locate = getLocator().locate(result);
    const body: ScanResponse = { locate, ocr: result, meta: { ...meta, totalMs: Date.now() - t0 } };
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
      }),
    );
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error(JSON.stringify({ evt: "scan_error", message }));
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
