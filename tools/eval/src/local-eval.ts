/**
 * Evaluates the local OCR (vision + ONNX recognizer + matcher) without any API.
 *
 *   pnpm --filter @navtora/eval local -- --model ../../apps/web/public/models/stam-crnn.onnx \
 *        [--synth ../train/data/synth/eval] [--real photo.png:132 ...] [--limit 200] [--min-prob 0.5] [--verbose]
 *
 * --synth: synthetic photos with their truth (column and lines), from tools/train/synth.py --no-shuffle.
 * --real:  photos whose standard column is known, as path:column.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import * as ort from "onnxruntime-node";
import { loadDataNode } from "@navtora/data";
import { createLocator, tokenizeHebrew, type LocateResult } from "@navtora/core";
import { batchedRecognizer, LocalOcr, type OcrImage } from "@navtora/ocr";

interface SynthMeta {
  column: number;
  lines: Array<{ index: number; text: string }>;
}

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur.push(Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)));
    prev = cur;
  }
  return prev[b.length]!;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const modelPath = get("--model") ?? "../../apps/web/public/models/stam-crnn.onnx";
  const synthDir = get("--synth");
  const limit = Number(get("--limit") ?? "200");
  const minProb = Number(get("--min-prob") ?? "0.5");
  const verbose = argv.includes("--verbose");
  const real = argv.flatMap((a, i) => (argv[i - 1] === "--real" ? [a] : []));

  const session = await ort.InferenceSession.create(modelPath, { intraOpNumThreads: 4 });
  const recognize = batchedRecognizer(async (data, dims) => {
    const out = await session.run({ ink: new ort.Tensor("float32", data, dims) });
    const t = out.logprobs!;
    return { data: t.data as Float32Array, dims: t.dims };
  });
  const decode = async (image: OcrImage) => {
    const { data, info } = await sharp(image.bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), width: info.width, height: info.height, channels: 3 as const };
  };
  const ocr = new LocalOcr(decode, recognize, { minLetterProb: minProb });
  const data = loadDataNode();
  const locator = createLocator(data, { debug: true });

  const tally = { n: 0, confOk: 0, confWrong: 0, ambiguous: 0, insufficient: 0, ms: 0, cerErr: 0, cerLen: 0 };
  const judge = (res: LocateResult, span: { startWord: number; endWord: number } | null): string => {
    const best = res.best ?? res.alternatives[0];
    let hit: boolean | null = null;
    if (span && best) {
      const overlap = Math.min(best.span.endWord, span.endWord) - Math.max(best.span.startWord, span.startWord) + 1;
      const shorter = Math.min(best.span.endWord - best.span.startWord, span.endWord - span.startWord) + 1;
      hit = overlap >= shorter * 0.5;
    }
    tally.n++;
    if (res.status === "confident") {
      if (hit === false) tally.confWrong++;
      else tally.confOk++;
    } else if (res.status === "ambiguous") tally.ambiguous++;
    else tally.insufficient++;
    const col = best?.standardColumn?.column ?? "?";
    return `${res.status === "confident" ? (hit === false ? "✗✗" : "✓ ") : res.status === "ambiguous" ? "? " : "· "} col ${col}`;
  };

  if (synthDir) {
    const ids = fs.readdirSync(synthDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort().slice(0, limit);
    for (const id of ids) {
      const meta = JSON.parse(fs.readFileSync(path.join(synthDir, `${id}.json`), "utf8")) as SynthMeta;
      const col = data.layout.columns[meta.column - 1]!;
      const ls = meta.lines.map((l) => col.lines[l.index]!).filter((l) => l.end >= l.start);
      const span = ls.length ? { startWord: Math.min(...ls.map((l) => l.start)), endWord: Math.max(...ls.map((l) => l.end)) } : null;
      const t0 = Date.now();
      const read = await ocr.recognizeImage({ bytes: new Uint8Array(fs.readFileSync(path.join(synthDir, `${id}.jpg`))), mime: "image/jpeg" });
      const res = locator.locate(read.result);
      tally.ms += Date.now() - t0;
      // rough CER: whole transcription against the whole window, spaces removed
      const truth = meta.lines.map((l) => l.text).join("").replace(/ /g, "");
      const got = read.result.lines.map((l) => l.text).join("").replace(/ /g, "");
      tally.cerErr += editDistance(got, truth);
      tally.cerLen += truth.length;
      const mark = judge(res, span);
      if (verbose || mark.startsWith("✗")) console.log(`${id} col ${meta.column} lines ${meta.lines.length} → ${mark} | read ${read.result.lines.length} lines | ${read.result.lines[1]?.text ?? ""}`);
    }
  }
  for (const spec of real) {
    const [file, colStr] = spec.split(":");
    const column = Number(colStr);
    const c = data.layout.columns[column - 1]!;
    const t0 = Date.now();
    const read = await ocr.recognizeImage({ bytes: new Uint8Array(fs.readFileSync(file!)), mime: "image/png" });
    const res = locator.locate(read.result);
    tally.ms += Date.now() - t0;
    const mark = judge(res, { startWord: c.startWord, endWord: c.endWord });
    console.log(`${path.basename(file!)} (column ${column}) → ${mark} | ${read.result.lines.length} lines, vision ${read.ms.vision.toFixed(0)} ms, model ${read.ms.model.toFixed(0)} ms`);
    if (verbose) {
      read.result.lines.slice(0, 8).forEach((l, i) => console.log(`   ${i}: ${l.text}`));
      console.log(`   truth: ${tokenizeHebrew(c.lines[0]!.text).join(" ")}`);
    }
  }
  const pct = (x: number) => `${((100 * x) / Math.max(1, tally.n)).toFixed(1)}%`;
  console.log(
    `\n${tally.n} photos: confident & right ${pct(tally.confOk)}, confident & WRONG ${pct(tally.confWrong)}, ambiguous ${pct(tally.ambiguous)}, insufficient ${pct(tally.insufficient)} | ` +
      `${(tally.ms / Math.max(1, tally.n)).toFixed(0)} ms/photo` +
      (tally.cerLen ? ` | rough CER ${((100 * tally.cerErr) / tally.cerLen).toFixed(1)}%` : ""),
  );
}

void main();
