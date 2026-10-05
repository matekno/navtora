/** Shared by the local reader on the main thread and in its worker. */
import { batchedRecognizer, type LineRecognizer, type LocalRead } from "@navtora/ocr/local";
import { lineYAt } from "@navtora/vision";

export const MODEL_URL = "/models/stam-crnn.onnx";

/** The slice of onnxruntime-web this app uses (global from the script build, or the ESM module). */
export interface OrtTensor {
  data: Float32Array;
  dims: readonly number[];
}
export interface OrtSession {
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
}
export interface OrtGlobal {
  env: { wasm: { wasmPaths?: string; numThreads?: number } };
  Tensor: new (type: "float32", data: Float32Array, dims: readonly number[]) => OrtTensor;
  InferenceSession: { create(url: string, opts?: { executionProviders?: string[] }): Promise<OrtSession> };
}

export async function createRecognizer(ort: OrtGlobal, origin = ""): Promise<LineRecognizer> {
  ort.env.wasm.wasmPaths = `${origin}/ort/`;
  // threads need cross-origin isolation, which this site does not set up
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(`${origin}${MODEL_URL}`, { executionProviders: ["wasm"] });
  return batchedRecognizer(async (data, dims) => {
    const out = await session.run({ ink: new ort.Tensor("float32", data, dims) });
    const t = out.logprobs!;
    return { data: t.data, dims: t.dims };
  });
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
