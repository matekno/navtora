import type { WordIndex } from "./index-words";
import { wordSimilarity } from "./distance";
import { tokenizeHebrew } from "./normalize";
import type { AlignmentCandidate, OcrResult } from "./types";

export interface Token {
  text: string;
  line: number;
  /** posición secuencial global en la columna transcripta */
  k: number;
}

export function tokensFromOcr(ocr: OcrResult): Token[] {
  const out: Token[] = [];
  let k = 0;
  ocr.lines.forEach((line, li) => {
    for (const t of tokenizeHebrew(line.text)) {
      out.push({ text: t, line: li, k: k++ });
    }
  });
  return out;
}

export interface MatchOptions {
  binWidth: number;
  maxBins: number;
  /** las formas con más de estas posiciones no votan en difuso, sólo en exacto */
  maxPositionsForFuzzy: number;
  /** margen de ventana alrededor del origen para el alineamiento fino */
  windowPad: number;
  /** similitud mínima para considerar un par palabra-token como coincidencia en el DP */
  minPairSimilarity: number;
}

export const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  binWidth: 4,
  maxBins: 6,
  maxPositionsForFuzzy: 1500,
  windowPad: 10,
  minPairSimilarity: 0.6,
};

interface Bin {
  bin: number;
  score: number;
}

/**
 * Votación diagonal: cada candidato en posición p para el token k vota el
 * origen p - k. Los bins con más peso son los puntos de partida probables.
 */
export function voteOrigins(tokens: Token[], index: WordIndex, opts: MatchOptions): Bin[] {
  const acc = new Map<number, number>();
  const add = (bin: number, w: number) => acc.set(bin, (acc.get(bin) ?? 0) + w);
  for (const tok of tokens) {
    const cands = index.candidates(tok.text);
    for (const c of cands) {
      if (c.similarity < 1 && c.positions.length > opts.maxPositionsForFuzzy) continue;
      // peso: IDF por calidad de coincidencia; las formas muy frecuentes casi no pesan
      const w = c.idf * (c.similarity === 1 ? 1 : c.similarity * 0.8);
      if (w <= 0) continue;
      for (const p of c.positions) {
        const origin = p - tok.k;
        const bin = Math.floor(origin / opts.binWidth);
        add(bin, w);
        add(bin - 1, w * 0.5);
        add(bin + 1, w * 0.5);
      }
    }
  }
  const bins = [...acc.entries()].map(([bin, score]) => ({ bin, score })).sort((a, b) => b.score - a.score);
  // suprimir bins vecinos de uno mejor
  const chosen: Bin[] = [];
  for (const b of bins) {
    if (chosen.length >= opts.maxBins) break;
    if (chosen.some((c) => Math.abs(c.bin - b.bin) <= 2)) continue;
    chosen.push(b);
  }
  return chosen;
}

/**
 * Alineamiento local (Smith-Waterman) entre la secuencia de tokens y una
 * ventana del texto. Devuelve el mejor tramo alineado y sus estadísticas.
 */
export function alignWindow(
  tokens: Token[],
  words: readonly string[],
  windowStart: number,
  windowEnd: number,
  lineCount: number,
  opts: MatchOptions,
): AlignmentCandidate | null {
  const m = tokens.length;
  const n = windowEnd - windowStart + 1;
  if (m === 0 || n <= 0) return null;

  const GAP = -0.6;
  const MISMATCH = -1.0;
  // matriz (m+1) x (n+1)
  const H = new Float64Array((m + 1) * (n + 1));
  const T = new Uint8Array((m + 1) * (n + 1)); // 0 stop, 1 diag, 2 up (token sin palabra), 3 left (palabra sin token)
  const at = (i: number, j: number) => i * (n + 1) + j;

  let best = 0;
  let bi = 0;
  let bj = 0;
  for (let i = 1; i <= m; i++) {
    const tk = tokens[i - 1]!.text;
    for (let j = 1; j <= n; j++) {
      const w = words[windowStart + j - 1]!;
      const sim = tk === w ? 1 : wordSimilarity(tk, w, 1 - opts.minPairSimilarity);
      const pair = sim >= opts.minPairSimilarity ? sim * 2 - 1 + (tk.length >= 4 ? 0.3 : 0) : MISMATCH;
      const diag = H[at(i - 1, j - 1)]! + pair;
      const up = H[at(i - 1, j)]! + GAP;
      const left = H[at(i, j - 1)]! + GAP;
      let v = 0;
      let t = 0;
      if (diag > v) {
        v = diag;
        t = 1;
      }
      if (up > v) {
        v = up;
        t = 2;
      }
      if (left > v) {
        v = left;
        t = 3;
      }
      H[at(i, j)] = v;
      T[at(i, j)] = t;
      if (v > best) {
        best = v;
        bi = i;
        bj = j;
      }
    }
  }
  if (best <= 0) return null;

  // traceback
  const lineStarts: Array<number | null> = new Array(lineCount).fill(null);
  let i = bi;
  let j = bj;
  let aligned = 0;
  let firstWord = -1;
  let lastWord = -1;
  const linesSeen = new Set<number>();
  while (i > 0 && j > 0) {
    const t = T[at(i, j)]!;
    if (t === 0) break;
    if (t === 1) {
      const tk = tokens[i - 1]!;
      const wordIdx = windowStart + j - 1;
      const sim = tk.text === words[wordIdx] ? 1 : wordSimilarity(tk.text, words[wordIdx]!, 1 - opts.minPairSimilarity);
      if (sim >= opts.minPairSimilarity) {
        aligned++;
        linesSeen.add(tk.line);
        lineStarts[tk.line] = wordIdx; // se sobreescribe hacia atrás: queda la primera palabra alineada de la línea
        if (lastWord < 0) lastWord = wordIdx;
        firstWord = wordIdx;
      }
      i--;
      j--;
    } else if (t === 2) {
      i--;
    } else {
      j--;
    }
  }
  if (aligned === 0 || firstWord < 0) return null;
  return {
    startWord: firstWord,
    endWord: lastWord,
    score: best,
    coverage: aligned / m,
    alignedTokens: aligned,
    linesCovered: linesSeen.size,
    lineStarts,
  };
}

/**
 * Localiza la secuencia de tokens en el texto: votación gruesa y refinamiento
 * fino de los mejores orígenes. Devuelve candidatos ordenados por score,
 * sin solapamientos.
 */
export function matchTokens(
  tokens: Token[],
  words: readonly string[],
  index: WordIndex,
  lineCount: number,
  opts: MatchOptions = DEFAULT_MATCH_OPTIONS,
): AlignmentCandidate[] {
  if (tokens.length === 0) return [];
  const bins = voteOrigins(tokens, index, opts);
  const results: AlignmentCandidate[] = [];
  for (const b of bins) {
    const origin = b.bin * opts.binWidth;
    const start = Math.max(0, origin - opts.windowPad);
    const end = Math.min(words.length - 1, origin + tokens.length + opts.binWidth + opts.windowPad);
    const c = alignWindow(tokens, words, start, end, lineCount, opts);
    if (c) results.push(c);
  }
  results.sort((a, b) => b.score - a.score);
  // quitar duplicados: dos candidatos son el mismo tramo si sus spans se solapan en más de la mitad del más corto
  const distinct: AlignmentCandidate[] = [];
  for (const c of results) {
    const dup = distinct.some((d) => {
      const overlap = Math.min(d.endWord, c.endWord) - Math.max(d.startWord, c.startWord) + 1;
      const shorter = Math.min(d.endWord - d.startWord, c.endWord - c.startWord) + 1;
      return overlap > shorter * 0.5;
    });
    if (dup) continue;
    distinct.push(c);
  }
  return distinct;
}
