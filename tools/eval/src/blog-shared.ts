/** Helpers shared by the scripts that make the blog's figures (blog-figures.ts, blog-real.ts). */
import { DEFAULT_MATCH_OPTIONS, isConfusable, wordSimilarity, type Token } from "@navtora/core";
import { LOCAL_ALPHABET, type LineLogits } from "@navtora/ocr";

/** decimals kept in the JSON */
export const r1 = (v: number) => Math.round(v * 10) / 10;
export const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Per time step of a line, the letter the network liked best ("" for the CTC blank) and its probability. */
export function ctcSteps(l: LineLogits | undefined): Array<{ c: string; p: number }> {
  if (!l) return [];
  const out: Array<{ c: string; p: number }> = [];
  for (let t = 0; t < l.steps; t++) {
    let best = 0;
    let bestV = -Infinity;
    for (let c = 0; c < l.classes; c++) {
      const v = l.data[t * l.classes + c]!;
      if (v > bestV) {
        bestV = v;
        best = c;
      }
    }
    out.push({ c: best === 0 ? "" : (LOCAL_ALPHABET[best - 1] ?? ""), p: r3(Math.exp(bestV)) });
  }
  return out;
}

/**
 * Where each word of a decoded line sits: the time steps of its first and last
 * letter. Words are split where the network output a space, as in ctcDecode.
 */
export function wordSteps(steps: Array<{ c: string }>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let open: [number, number] | null = null;
  for (let t = 0; t < steps.length; t++) {
    const c = steps[t]!.c;
    if (c === " ") {
      if (open) out.push(open);
      open = null;
    } else if (c !== "") {
      if (open) open[1] = t;
      else open = [t, t];
    }
  }
  if (open) out.push(open);
  return out;
}

export type PairKind = "same" | "confusable" | "wildcard" | "different" | "extra";

/** Kind of difference between a word as read and the word in the scroll. */
export function pairKind(read: string, word: string): PairKind {
  if (read === word) return "same";
  if (read.length !== word.length) return "different";
  let wildcard = false;
  for (let i = 0; i < read.length; i++) {
    if (read[i] === word[i]) continue;
    if (read[i] === "?") wildcard = true;
    else if (!isConfusable(read[i]!, word[i]!)) return "different";
  }
  return wildcard ? "wildcard" : "confusable";
}

/**
 * The matcher's local alignment (same scores as alignWindow), keeping which
 * word each token was paired with, for the figure that compares them.
 */
export function alignPairs(tokens: Token[], span: readonly string[], start: number): Array<{ k: number; line: number; read: string; word: string | null; position: number | null; kind: PairKind }> {
  const m = tokens.length;
  const n = span.length;
  const minSim = DEFAULT_MATCH_OPTIONS.minPairSimilarity;
  const sim = (i: number, j: number) => (tokens[i]!.text === span[j] ? 1 : wordSimilarity(tokens[i]!.text, span[j]!, 1 - minSim));
  const H = new Float64Array((m + 1) * (n + 1));
  const T = new Uint8Array((m + 1) * (n + 1));
  const at = (i: number, j: number) => i * (n + 1) + j;
  let best = 0;
  let bi = 0;
  let bj = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = sim(i - 1, j - 1);
      const pair = s >= minSim ? s * 2 - 1 + (tokens[i - 1]!.text.length >= 4 ? 0.3 : 0) : -1;
      const opts = [0, H[at(i - 1, j - 1)]! + pair, H[at(i - 1, j)]! - 0.6, H[at(i, j - 1)]! - 0.6];
      let t = 0;
      for (let k = 1; k < 4; k++) if (opts[k]! > opts[t]!) t = k;
      H[at(i, j)] = opts[t]!;
      T[at(i, j)] = t;
      if (opts[t]! > best) {
        best = opts[t]!;
        bi = i;
        bj = j;
      }
    }
  }
  const out: Array<{ k: number; line: number; read: string; word: string | null; position: number | null; kind: PairKind }> = [];
  let i = bi;
  let j = bj;
  while (i > 0 && j > 0 && T[at(i, j)] !== 0) {
    const t = T[at(i, j)]!;
    if (t === 1) {
      const tok = tokens[i - 1]!;
      const ok = sim(i - 1, j - 1) >= minSim;
      out.push({ k: tok.k, line: tok.line, read: tok.text, word: ok ? span[j - 1]! : null, position: ok ? start + j - 1 : null, kind: ok ? pairKind(tok.text, span[j - 1]!) : "extra" });
      i--;
      j--;
    } else if (t === 2) {
      out.push({ k: tokens[i - 1]!.k, line: tokens[i - 1]!.line, read: tokens[i - 1]!.text, word: null, position: null, kind: "extra" });
      i--;
    } else j--;
  }
  return out.reverse();
}
