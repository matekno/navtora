import { tokenizeHebrew } from "./normalize";
import { BOOK_NAMES, TorahText } from "./text";
import type {
  AlignmentCandidate,
  LayoutData,
  LayoutEstimate,
  OcrResult,
  ParashotData,
  Placement,
  StandardColumnMatch,
} from "./types";

export interface ResolveContext {
  text: TorahText;
  parashot: ParashotData;
  layout: LayoutData | null;
}

/** Estimates the scroll's layout from what the OCR saw and what was aligned. */
export function estimateLayout(ocr: OcrResult, cand: AlignmentCandidate, text: TorahText): LayoutEstimate {
  const linesTranscribed = ocr.lines.length;
  const linesVisible = ocr.lineCountVisible ?? linesTranscribed;
  // words per line: mean distance between the starts of consecutive aligned lines
  const starts = cand.lineStarts.filter((x): x is number => x !== null);
  let wordsPerLine = 0;
  if (starts.length >= 2) {
    const deltas: number[] = [];
    for (let i = 1; i < cand.lineStarts.length; i++) {
      const a = cand.lineStarts[i - 1] ?? null;
      const b = cand.lineStarts[i] ?? null;
      if (a !== null && b !== null && b > a && b - a < 40) deltas.push(b - a);
    }
    if (deltas.length > 0) wordsPerLine = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  }
  if (wordsPerLine === 0) {
    const tokensPerLine = ocr.lines.map((l) => tokenizeHebrew(l.text).length).filter((n) => n > 0);
    wordsPerLine = tokensPerLine.length ? tokensPerLine.reduce((s, n) => s + n, 0) / tokensPerLine.length : 0;
  }
  const fullColumn = linesVisible >= 35;
  const wordsPerColumn = fullColumn && wordsPerLine > 0 ? Math.round(wordsPerLine * linesVisible) : null;
  void text;
  return { linesTranscribed, linesVisible, wordsPerLine: Math.round(wordsPerLine * 10) / 10, wordsPerColumn };
}

/** Finds the standard-layout column containing the span. */
export function matchStandardColumn(cand: AlignmentCandidate, layout: LayoutData | null): StandardColumnMatch | null {
  if (!layout) return null;
  // the column holding most of the span: a noisy reading can pull the last word or two of the
  // previous column into the start of the span
  let col: LayoutData["columns"][number] | null = null;
  let most = 0;
  for (const c of layout.columns) {
    const overlap = Math.min(cand.endWord, c.endWord) - Math.max(cand.startWord, c.startWord) + 1;
    if (overlap > most) {
      most = overlap;
      col = c;
    }
  }
  if (!col) return null;
  const inColumn = col;
  const firstAligned = cand.lineStarts.find((x): x is number => x !== null && x >= inColumn.startWord && x <= inColumn.endWord);
  let firstLine: number | null = null;
  if (firstAligned !== undefined) {
    const li = col.lines.findIndex((l) => firstAligned >= l.start && firstAligned <= l.end);
    if (li >= 0) firstLine = li + 1;
  }
  const fromColumnStart = Math.abs(cand.startWord - col.startWord) <= 2;
  return { column: col.n, fromColumnStart, firstLine };
}

export function buildPlacement(
  cand: AlignmentCandidate,
  ocr: OcrResult,
  ctx: ResolveContext,
  margin: number,
): Placement {
  const { text, parashot, layout } = ctx;
  const startRef = text.refOf(cand.startWord);
  const endRef = text.refOf(cand.endWord);
  const bookN = startRef.book;

  const parashotHit = parashot.filter((p) => p.startWord <= cand.endWord && p.endWord >= cand.startWord);
  const aliyot: Placement["aliyot"] = [];
  for (const p of parashotHit) {
    for (const a of p.aliyot) {
      if (a.n === "M") continue; // maftir repeats the end of the seventh aliyah; it is reported separately
      if (a.startWord <= cand.endWord && a.endWord >= cand.startWord) {
        aliyot.push({
          parasha: p.n,
          parashaName: p.name,
          n: a.n,
          startsHere: a.startWord >= cand.startWord && a.startWord <= cand.endWord,
        });
      }
    }
  }

  const standardColumn = matchStandardColumn(cand, layout);
  let firstWordsVocalized: string | null = null;
  if (standardColumn && layout) {
    const col = layout.columns[standardColumn.column - 1];
    const line = col?.lines.find((l) => cand.startWord >= l.start && cand.startWord <= l.end);
    if (line) {
      const offset = cand.startWord - line.start;
      firstWordsVocalized = line.text.split(" ").slice(offset, offset + 4).join(" ");
    }
  }

  return {
    span: { startWord: cand.startWord, endWord: cand.endWord },
    book: { n: bookN, name: BOOK_NAMES[bookN]! },
    parashot: parashotHit.map((p) => ({ n: p.n, name: p.name })),
    aliyot,
    verses: { start: startRef, end: endRef },
    firstWords: text.slice(cand.startWord, Math.min(cand.endWord, cand.startWord + 3)),
    firstWordsVocalized,
    standardColumn,
    layout: estimateLayout(ocr, cand, text),
    confidence: {
      score: Math.round(cand.score * 100) / 100,
      margin: Math.round(margin * 1000) / 1000,
      alignedTokens: cand.alignedTokens,
      linesCovered: cand.linesCovered,
      coverage: Math.round(cand.coverage * 1000) / 1000,
    },
  };
}
