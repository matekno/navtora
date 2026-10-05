/**
 * Local OCR in the browser: the photo never leaves the phone. ONNX Runtime Web
 * is loaded from /ort (copied there from node_modules by scripts/copy-ort.mjs)
 * as a classic script, so the bundler never touches its WebAssembly loader.
 * The recognizer model is /models/stam-crnn.onnx.
 */
import { batchedRecognizer, readColumnLocally, type LineRecognizer, type LocalRead } from "@navtora/ocr/local";
import { lineYAt } from "@navtora/vision";

const ORT_SCRIPT = "/ort/ort.wasm.min.js";
const MODEL_URL = "/models/stam-crnn.onnx";

/** The slice of the onnxruntime-web global this module uses. */
interface OrtTensor {
  data: Float32Array;
  dims: readonly number[];
}
interface OrtGlobal {
  env: { wasm: { wasmPaths?: string; numThreads?: number } };
  Tensor: new (type: "float32", data: Float32Array, dims: readonly number[]) => OrtTensor;
  InferenceSession: { create(url: string, opts?: { executionProviders?: string[] }): Promise<OrtSession> };
}
interface OrtSession {
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
}

let ready: Promise<LineRecognizer> | null = null;

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

/** Loads the runtime and the model once; later calls reuse them. */
export function loadLocalOcr(): Promise<LineRecognizer> {
  if (!ready) {
    ready = (async () => {
      const g = globalThis as unknown as { ort?: OrtGlobal };
      if (!g.ort) await loadScript(ORT_SCRIPT);
      const ort = g.ort;
      if (!ort) throw new Error("ONNX Runtime did not load.");
      ort.env.wasm.wasmPaths = "/ort/";
      // threads need cross-origin isolation, which this site does not set up
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"] });
      return batchedRecognizer(async (data, dims) => {
        const out = await session.run({ ink: new ort.Tensor("float32", data, dims) });
        const t = out.logprobs!;
        return { data: t.data, dims: t.dims };
      });
    })();
    ready.catch(() => {
      ready = null; // allow a retry after a network error
    });
  }
  return ready;
}

/** What the phone found in the photo, in photo pixels, to draw over it. */
export interface ReadOverlay {
  width: number;
  height: number;
  /** one polyline per text line, along its center */
  lines: Array<Array<[number, number]>>;
}

export function overlayOf(read: LocalRead, width: number, height: number): ReadOverlay {
  const L = read.analysis.layout;
  const s = read.analysis.scale;
  const lines: ReadOverlay["lines"] = [];
  for (const line of L?.lines ?? []) {
    const pts: Array<[number, number]> = [];
    const n = 12;
    // right to left, the reading order, so the drawing animation follows it
    for (let i = 0; i <= n; i++) {
      const x = line.x1 - ((line.x1 - line.x0) * i) / n;
      pts.push([Math.round(x / s), Math.round(lineYAt(line, x) / s)]);
    }
    lines.push(pts);
  }
  return { width, height, lines };
}

/** Decodes the photo and reads it with the local pipeline. */
export async function readPhotoLocally(blob: Blob): Promise<LocalRead & { overlay: ReadOverlay }> {
  const recognize = await loadLocalOcr();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get a 2D canvas context.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const read = await readColumnLocally(data, width, height, 4, recognize);
  return { ...read, overlay: overlayOf(read, width, height) };
}
