/**
 * Local OCR in the browser: the photo never leaves the phone. The reading runs
 * in a worker (lib/local-ocr.worker.ts) so the screen keeps animating; where a
 * worker can't start, it runs here instead. ONNX Runtime Web is served from
 * /ort, copied there from node_modules by scripts/copy-ort.mjs, and kept out
 * of the bundle. The recognizer model is /models/stam-crnn.onnx.
 */
import type { OcrResult } from "@navtora/core";
import { readColumnLocally, type LineRecognizer } from "@navtora/ocr/local";
import { createRecognizer, overlayOf, type OrtGlobal, type ReadOverlay } from "./local-ocr-core";
import type { WorkerRequest, WorkerResponse } from "./local-ocr.worker";

export type { ReadOverlay } from "./local-ocr-core";

export interface PhoneRead {
  result: OcrResult;
  overlay: ReadOverlay;
  ms: { vision: number; model: number };
}

// ---- worker

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, { resolve: (r: WorkerResponse) => void }>();

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("./local-ocr.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        pending.get(e.data.id)?.resolve(e.data);
        pending.delete(e.data.id);
      };
      worker.onerror = () => {
        // a worker that fails to start: answer what's pending and use the main thread from now on
        workerBroken = true;
        worker = null;
        for (const [id, p] of pending) p.resolve({ id, ok: false, error: "worker failed" });
        pending.clear();
      };
    } catch {
      workerBroken = true;
      return null;
    }
  }
  return worker;
}

function ask(w: Worker, msg: WorkerRequest, transfer: Transferable[] = []): Promise<WorkerResponse> {
  return new Promise((resolve) => {
    pending.set(msg.id, { resolve });
    w.postMessage(msg, transfer);
  });
}

// ---- main thread fallback

let mainReady: Promise<LineRecognizer> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

function loadOnMainThread(): Promise<LineRecognizer> {
  if (!mainReady) {
    mainReady = (async () => {
      const g = globalThis as unknown as { ort?: OrtGlobal };
      if (!g.ort) await loadScript("/ort/ort.wasm.min.js");
      if (!g.ort) throw new Error("ONNX Runtime did not load.");
      return createRecognizer(g.ort);
    })();
    mainReady.catch(() => {
      mainReady = null; // allow a retry after a network error
    });
  }
  return mainReady;
}

// ---- API

/** Loads the runtime and the model ahead of the first scan. */
export async function loadLocalOcr(): Promise<void> {
  const w = getWorker();
  if (w) {
    const r = await ask(w, { id: nextId++, type: "load" });
    if (r.ok) return;
    if (!workerBroken) throw new Error(r.error);
  }
  await loadOnMainThread();
}

async function pixelsOf(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get a 2D canvas context.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Decodes the photo and reads it with the local pipeline. */
export async function readPhotoLocally(blob: Blob): Promise<PhoneRead> {
  const img = await pixelsOf(blob);
  const w = getWorker();
  if (w) {
    const buffer = img.data.buffer;
    const r = await ask(w, { id: nextId++, type: "read", pixels: buffer, width: img.width, height: img.height }, [buffer]);
    if (r.ok && r.result && r.overlay && r.ms) return { result: r.result, overlay: r.overlay, ms: r.ms };
    if (!workerBroken) throw new Error(r.ok ? "empty answer" : r.error);
    return readPhotoLocally(blob); // the worker died: start over on the main thread
  }
  const recognize = await loadOnMainThread();
  const read = await readColumnLocally(img.data, img.width, img.height, 4, recognize);
  return { result: read.result, overlay: overlayOf(read, img.width, img.height), ms: read.ms };
}
