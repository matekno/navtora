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
import { loadDataNode } from "@navtora/data";
import { createLocator, tokenizeHebrew, type LayoutData, type LocateResult } from "@navtora/core";
import type { LocalRead } from "@navtora/ocr";
import { createLocalOcr, DEFAULT_MODEL } from "./local-provider";

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

/** Written (ketiv) consonantal text of a layout line. */
function writtenText(text: string): string {
  return tokenizeHebrew(text.replace(/#\[[^\]]*\]/g, "").replace("#(פ)", "")).join(" ");
}

/**
 * Letter errors of the text read from a real photo of a known standard column.
 * The detected lines are consecutive lines of the column; the matcher's
 * placement gives a first guess of which column line each crop is, refined to
 * the offset with the fewest errors. Lines are compared as one text, because
 * a printed tikkun or a sefer may break lines a word earlier or later than the
 * standard layout.
 */
function realLineErrors(read: LocalRead, res: LocateResult, col: LayoutData["columns"][number]) {
  const layoutLines = read.analysis.layout?.lines ?? [];
  // result lines skip crops that decoded to nothing; map them back to crops
  const cropOf: number[] = [];
  read.decoded.forEach((d, k) => {
    if (d.text.replace(/[ ?]/g, "").length > 0) cropOf.push(k);
  });
  const starts = res.debug?.candidates[0]?.lineStarts ?? [];
  const guesses = new Set<number>();
  starts.forEach((w, i) => {
    if (w === null || w === undefined) return;
    const li = col.lines.findIndex((l) => l.start <= w && w <= l.end);
    if (li >= 0 && cropOf[i] !== undefined) for (const d of [-1, 0, 1]) guesses.add(cropOf[i]! - li + d);
  });
  let best: { err: number; len: number; unsure: number; letters: number; lines: number } | null = null;
  for (const offset of guesses) {
    const got: string[] = [];
    const want: string[] = [];
    read.decoded.forEach((d, k) => {
      const truthLine = col.lines[k - offset];
      if (!truthLine || layoutLines[k]?.cut) return;
      const truth = writtenText(truthLine.text);
      if (!truth) return;
      got.push(d.text);
      want.push(truth);
    });
    if (want.length < 3) continue;
    const g = got.join(" ");
    const t = want.join(" ");
    const err = editDistance(g, t);
    if (!best || err / t.length < best.err / best.len) {
      best = { err, len: t.length, unsure: (g.match(/\?/g) ?? []).length, letters: g.replace(/ /g, "").length, lines: want.length };
    }
  }
  return best;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const modelPath = get("--model") ?? DEFAULT_MODEL;
  const synthDir = get("--synth");
  const limit = Number(get("--limit") ?? "200");
  const minProb = Number(get("--min-prob") ?? "0.5");
  const verbose = argv.includes("--verbose");
  const real = argv.flatMap((a, i) => (argv[i - 1] === "--real" ? [a] : []));

  const ocr = await createLocalOcr(modelPath, { minLetterProb: minProb });
  const data = loadDataNode();
  const locator = createLocator(data, { debug: true });

  const real_ = { err: 0, len: 0, unsure: 0, letters: 0 };
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
    const cer = realLineErrors(read, res, c);
    if (cer) {
      real_.err += cer.err;
      real_.len += cer.len;
      real_.unsure += cer.unsure;
      real_.letters += cer.letters;
    }
    console.log(
      `${path.basename(file!)} (column ${column}) → ${mark} | ${read.result.lines.length} lines, vision ${read.ms.vision.toFixed(0)} ms, model ${read.ms.model.toFixed(0)} ms` +
        (cer ? ` | CER ${((100 * cer.err) / cer.len).toFixed(1)}% over ${cer.lines} lines, ? ${((100 * cer.unsure) / Math.max(1, cer.letters)).toFixed(1)}%` : ""),
    );
    if (verbose) {
      read.result.lines.slice(0, 8).forEach((l, i) => console.log(`   ${i}: ${l.text}`));
      console.log(`   truth: ${tokenizeHebrew(c.lines[0]!.text).join(" ")}`);
    }
  }
  if (real_.len) {
    console.log(`real photos: CER ${((100 * real_.err) / real_.len).toFixed(1)}% (a ? counts as an error), ? on ${((100 * real_.unsure) / Math.max(1, real_.letters)).toFixed(1)}% of letters`);
  }
  const pct = (x: number) => `${((100 * x) / Math.max(1, tally.n)).toFixed(1)}%`;
  console.log(
    `\n${tally.n} photos: confident & right ${pct(tally.confOk)}, confident & WRONG ${pct(tally.confWrong)}, ambiguous ${pct(tally.ambiguous)}, insufficient ${pct(tally.insufficient)} | ` +
      `${(tally.ms / Math.max(1, tally.n)).toFixed(0)} ms/photo` +
      (tally.cerLen ? ` | rough CER ${((100 * tally.cerErr) / tally.cerLen).toFixed(1)}%` : ""),
  );
}

void main();
