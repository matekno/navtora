/// <reference lib="webworker" />
/**
 * Runs the local reader off the main thread, so the screen keeps animating
 * while the phone reads. Receives RGBA pixels, answers with the transcription
 * and the lines it found (see lib/local-ocr.ts).
 */
import { readColumnLocally, type LineRecognizer } from "@navtora/ocr/local";
import { createRecognizer, overlayOf, type OrtGlobal, type ReadOverlay } from "./local-ocr-core";
import type { OcrResult } from "@navtora/core";

export type WorkerRequest = { id: number; type: "load" } | { id: number; type: "read"; pixels: ArrayBuffer; width: number; height: number };
export type WorkerResponse =
  | { id: number; ok: true; result?: OcrResult; overlay?: ReadOverlay; ms?: { vision: number; model: number } }
  | { id: number; ok: false; error: string };

let ready: Promise<LineRecognizer> | null = null;

function load(): Promise<LineRecognizer> {
  if (!ready) {
    ready = (async () => {
      // the ESM build of ONNX Runtime Web, served from /ort and kept out of the bundle
      const url = `${self.location.origin}/ort/ort.wasm.min.mjs`;
      const ort = (await import(/* webpackIgnore: true */ url)) as OrtGlobal;
      return createRecognizer(ort, self.location.origin);
    })();
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  const post = (r: WorkerResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(r);
  try {
    const recognize = await load();
    if (msg.type === "load") return post({ id: msg.id, ok: true });
    const read = await readColumnLocally(new Uint8ClampedArray(msg.pixels), msg.width, msg.height, 4, recognize);
    post({ id: msg.id, ok: true, result: read.result, overlay: overlayOf(read, msg.width, msg.height), ms: read.ms });
  } catch (err) {
    post({ id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
