/**
 * Local OCR: no API, no cost. @navtora/vision finds the column and cuts each
 * line into a fixed-height strip; a small CRNN (CNN + BiLSTM, trained with
 * CTC in tools/train) reads each strip into letter probabilities; greedy CTC
 * decoding turns them into text. Letters the model is unsure of come out as
 * `?`, which the matcher treats as a cheap wildcard: a doubtful letter costs
 * less there than a confident wrong one.
 *
 * The model runner and the image decoder are injected, so the same code runs
 * in the browser (onnxruntime-web, canvas) and in Node (onnxruntime-node, sharp).
 */
import type { OcrLine, OcrResult } from "@navtora/core";
import { analyzeColumn, type ColumnAnalysis, type LineCrop } from "@navtora/vision";
import type { OcrImage, OcrOutput, OcrProvider } from "./provider";

/** Output classes after the CTC blank (index 0): space and the 27 letter forms. */
export const LOCAL_ALPHABET = " אבגדהוזחטיכךלמםנןסעפףצץקרשת";

export interface LineLogits {
  /** row-major log-probabilities, steps x classes */
  data: Float32Array;
  steps: number;
  classes: number;
}

/** Runs the recognizer on a batch of line crops of equal height. */
export type LineRecognizer = (crops: LineCrop[]) => Promise<LineLogits[]>;

/** Model input for a batch of crops: zero-padded to a common width (a multiple of 4). */
export function packCrops(crops: LineCrop[]): { data: Float32Array; dims: [number, number, number, number] } {
  const h = crops[0]!.height;
  const w = Math.ceil(Math.max(...crops.map((c) => c.width)) / 4) * 4;
  const data = new Float32Array(crops.length * h * w);
  crops.forEach((c, i) => {
    for (let y = 0; y < h; y++) data.set(c.data.subarray(y * c.width, (y + 1) * c.width), i * h * w + y * w);
  });
  return { data, dims: [crops.length, 1, h, w] };
}

/** Splits batched log-probabilities (batch x steps x classes) back per crop, dropping padded steps. */
export function unpackLogits(data: Float32Array, dims: readonly number[], crops: LineCrop[]): LineLogits[] {
  const steps = dims[1]!;
  const classes = dims[2]!;
  return crops.map((c, i) => {
    const own = Math.min(steps, Math.floor(c.width / 4));
    const start = i * steps * classes;
    return { data: data.subarray(start, start + own * classes), steps: own, classes };
  });
}

/**
 * Wraps a single-batch model call into a LineRecognizer that groups crops of
 * similar width (as in training) so padding stays small.
 */
export function batchedRecognizer(run: (data: Float32Array, dims: [number, number, number, number]) => Promise<{ data: Float32Array; dims: readonly number[] }>, batchSize = 12): LineRecognizer {
  return async (crops) => {
    const order = crops.map((_, i) => i).sort((a, b) => crops[a]!.width - crops[b]!.width);
    const out: LineLogits[] = new Array(crops.length);
    for (let s = 0; s < order.length; s += batchSize) {
      const idx = order.slice(s, s + batchSize);
      const group = idx.map((i) => crops[i]!);
      const packed = packCrops(group);
      const res = await run(packed.data, packed.dims);
      unpackLogits(res.data, res.dims, group).forEach((l, j) => (out[idx[j]!] = l));
    }
    return out;
  };
}

export interface DecodedLine {
  text: string;
  /** mean probability of the emitted letters */
  confidence: number;
}

/**
 * Greedy CTC decoding. A letter whose best probability over its run stays
 * below `minLetterProb` is written as `?`.
 */
export function ctcDecode(out: LineLogits, alphabet = LOCAL_ALPHABET, minLetterProb = 0.5): DecodedLine {
  const { data, steps, classes } = out;
  let text = "";
  let prev = 0;
  let runMax = 0;
  let runChar = "";
  let sum = 0;
  let count = 0;
  const flush = () => {
    if (!runChar) return;
    if (runChar === " ") {
      if (text.length > 0 && !text.endsWith(" ")) text += " ";
    } else {
      text += runMax >= minLetterProb ? runChar : "?";
      sum += runMax;
      count++;
    }
    runChar = "";
    runMax = 0;
  };
  for (let t = 0; t < steps; t++) {
    let best = 0;
    let bestV = -Infinity;
    const row = t * classes;
    for (let c = 0; c < classes; c++) {
      const v = data[row + c]!;
      if (v > bestV) {
        bestV = v;
        best = c;
      }
    }
    if (best !== prev) {
      flush();
      if (best !== 0) runChar = alphabet[best - 1] ?? "";
    }
    if (best !== 0) runMax = Math.max(runMax, Math.exp(bestV));
    prev = best;
  }
  flush();
  return { text: text.trim(), confidence: count > 0 ? sum / count : 0 };
}

export interface LocalReadOptions {
  minLetterProb?: number;
  /** lines whose mean letter confidence is below this are marked uncertain */
  uncertainBelow?: number;
  /** cap on lines read, from the top */
  maxLines?: number;
}

export interface LocalRead {
  result: OcrResult;
  analysis: ColumnAnalysis;
  decoded: DecodedLine[];
  ms: { vision: number; model: number };
}

/** Reads a decoded image (RGB or RGBA bytes) with the local pipeline. */
export async function readColumnLocally(
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: 3 | 4,
  recognize: LineRecognizer,
  opts: LocalReadOptions = {},
): Promise<LocalRead> {
  const t0 = now();
  const analysis = analyzeColumn(pixels, width, height, channels);
  const t1 = now();
  const layout = analysis.layout;
  const maxLines = opts.maxLines ?? 60;
  const lines = layout ? layout.lines.slice(0, maxLines) : [];
  const crops = analysis.crops.slice(0, lines.length);
  const logits = crops.length > 0 ? await recognize(crops) : [];
  const t2 = now();
  const decoded = logits.map((l) => ctcDecode(l, LOCAL_ALPHABET, opts.minLetterProb ?? 0.5));
  const uncertainBelow = opts.uncertainBelow ?? 0.6;
  const ocrLines: OcrLine[] = [];
  decoded.forEach((d, i) => {
    const line = lines[i]!;
    if (d.text.replace(/[ ?]/g, "").length === 0) return;
    ocrLines.push({ text: d.text, uncertain: line.cut || d.confidence < uncertainBelow, gapBefore: line.gapBefore === "full" ? "full" : "none" });
  });
  return { result: { lines: ocrLines, lineCountVisible: layout?.lines.length ?? 0 }, analysis, decoded, ms: { vision: t1 - t0, model: t2 - t1 } };
}

export interface DecodedImage {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels: 3 | 4;
}

/** OcrProvider over the local pipeline, for Node (eval) or any host that can decode images. */
export class LocalOcr implements OcrProvider {
  readonly name = "local";

  constructor(
    private readonly decode: (image: OcrImage) => Promise<DecodedImage>,
    private readonly runModel: LineRecognizer,
    private readonly opts: LocalReadOptions = {},
  ) {}

  async recognizeImage(image: OcrImage): Promise<LocalRead> {
    const img = await this.decode(image);
    return readColumnLocally(img.data, img.width, img.height, img.channels, this.runModel, this.opts);
  }

  async recognize(image: OcrImage): Promise<OcrOutput> {
    const t0 = now();
    const read = await this.recognizeImage(image);
    return { result: read.result, meta: { provider: this.name, model: "stam-crnn", ms: now() - t0 } };
  }
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
