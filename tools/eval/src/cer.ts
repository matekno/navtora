/**
 * Character error rate (CER) of the cached transcriptions for a standard-layout
 * set, against the true column text.
 *
 *   pnpm --filter @navtora/eval cer -- --set shannon --salt "claude-opus-5|2026-09-05.1" [--limit 20]
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDataNode } from "@navtora/data";
import { normalizeHebrew, tokenizeHebrew } from "@navtora/core";
import { imageHash } from "@navtora/ocr";

const here = path.dirname(fileURLToPath(import.meta.url));
const COLUMNS = path.resolve(here, "../data/columns");
const CACHE = path.resolve(here, "../data/ocr-cache");
const TRUTH = path.resolve(here, "../truth");

interface CachedOut {
  result: { lines: Array<{ text: string } | string>; lineCountVisible?: number };
  meta: { ms?: number; inputTokens?: number; outputTokens?: number; model?: string };
}

function levenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  let prev = new Uint32Array(m + 1);
  let curr = new Uint32Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m]!;
}

function main(): void {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const set = get("--set") ?? "shannon";
  const salt = get("--salt") ?? `${process.env.OCR_MODEL ?? "claude-opus-5"}|2026-09-05.1`;
  const limit = Number(get("--limit") ?? Infinity);
  const data = loadDataNode();
  const truth = JSON.parse(fs.readFileSync(path.join(TRUTH, `${set}.json`), "utf8")) as {
    offset?: number;
    segments?: Array<{ from: number; to: number; offset: number }>;
  };
  const files = fs
    .readdirSync(path.join(COLUMNS, set))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort()
    .slice(0, limit);

  let totalChars = 0;
  let totalErr = 0;
  let n = 0;
  console.log("file     col  lines ocr/true      CER   exact              ms  tok in/out");
  for (const file of files) {
    const k = Number(file.replace(/\D/g, ""));
    const offset = truth.segments ? truth.segments.find((s) => k >= s.from && k <= s.to)?.offset : truth.offset;
    if (offset === undefined) continue;
    const col = data.layout.columns[k - offset - 1];
    if (!col) continue;
    const bytes = new Uint8Array(fs.readFileSync(path.join(COLUMNS, set, file)));
    const cachePath = path.join(CACHE, `${imageHash({ bytes, mime: "image/jpeg" }, salt)}.json`);
    if (!fs.existsSync(cachePath)) continue;
    const out = JSON.parse(fs.readFileSync(cachePath, "utf8")) as CachedOut;
    const ocrLines = out.result.lines.map((l) => normalizeHebrew(typeof l === "string" ? l : l.text));
    const realLines = col.lines.map((l) => normalizeHebrew(l.text)).filter((l) => l.length > 0);
    // compare only the lines the OCR transcribed, in order
    const compared = Math.min(ocrLines.length, realLines.length);
    const ocrText = ocrLines.slice(0, compared).join(" ");
    const realText = realLines.slice(0, compared).join(" ");
    const err = levenshtein(ocrText.replace(/ /g, ""), realText.replace(/ /g, ""));
    const chars = realText.replace(/ /g, "").length;
    const realWords = new Set(tokenizeHebrew(realText));
    const ocrWords = tokenizeHebrew(ocrText);
    const exact = ocrWords.filter((w) => realWords.has(w)).length / Math.max(1, ocrWords.length);
    totalChars += chars;
    totalErr += err;
    n++;
    console.log(
      `${file}  ${String(k - offset).padStart(3)}  ${String(ocrLines.length).padStart(2)}/${String(realLines.length).padEnd(2)}            ${((err / chars) * 100).toFixed(1).padStart(5)}%  ${(exact * 100).toFixed(1).padStart(5)}%          ${String(out.meta.ms ?? "").padStart(6)}  ${out.meta.inputTokens ?? ""}/${out.meta.outputTokens ?? ""}`,
    );
  }
  if (n > 0) console.log(`\n${n} columns | overall CER ${((totalErr / totalChars) * 100).toFixed(2)}% over ${totalChars} letters`);
  else console.log("no cached transcriptions for that salt");
}

main();
