/**
 * Navigation: given the sefer's current position (what was just scanned) and a
 * target word, work out which way to roll, how many columns remain, and, once
 * there, which line the target starts on.
 *
 * Positions are word indices, independent of layout. Column counts come from
 * the standard layout when the scroll matches it, otherwise from the words per
 * column estimated from the photo. The result is data only; the app localizes it.
 */
import { TorahText } from "./text";
import type { LayoutData, Placement, VerseRef } from "./types";

export interface NavTarget {
  /** first word of the reading */
  word: number;
  /** last word, if known */
  endWord?: number;
  /** display label in the app's language, e.g. "Miketz, third aliyah" */
  label: string;
  /** first verse */
  ref: VerseRef;
}

/**
 * Which way to roll. The text runs right to left, so "towards-bereshit" means
 * the columns to the right and "towards-devarim" the columns to the left.
 */
export type NavDirection = "towards-bereshit" | "towards-devarim";

export interface NavLineHint {
  /** line number within the current column, 1 = top */
  line: number;
  /** derived from the standard layout or the scanned lines; false means estimated */
  exact: boolean;
  /** first words of the reading, consonantal */
  firstWords: string;
  /** the same words with nikkud, when the column follows the standard layout */
  firstWordsVocalized: string | null;
  /** blank space preceding the reading in the scroll */
  gapBefore: "petucha" | "setuma" | "none";
  /** the reading starts at the beginning of the line */
  atLineStart: boolean;
}

export interface Navigation {
  status: "here" | "move";
  direction: NavDirection | null;
  /** signed word distance from the current position to the target; negative = towards Bereshit */
  wordDelta: number;
  /** columns to roll, rounded; null if it cannot be estimated */
  columns: number | null;
  /** the column count comes from the standard layout */
  columnsExact: boolean;
  /** words per column used for the estimate, if any */
  wordsPerColumnUsed: number | null;
  /** when status is "here": where the target starts within the column */
  line: NavLineHint | null;
}

export interface NavContext {
  text: TorahText;
  layout: LayoutData | null;
  /** words per column learned from earlier scans of this same sefer, if any */
  learnedWordsPerColumn?: number | null;
}

/** Word span of the current column: the standard column if matched, otherwise the scanned span extended to the visible lines. */
function columnSpan(p: Placement, layout: LayoutData | null): { start: number; end: number } {
  if (p.standardColumn && layout) {
    const col = layout.columns[p.standardColumn.column - 1];
    if (col) return { start: col.startWord, end: col.endWord };
  }
  const est = p.layout;
  const wordsPerLine = est.wordsPerLine > 0 ? est.wordsPerLine : 8;
  const linesBelow = Math.max(0, est.linesVisible - est.linesTranscribed);
  const linesAbove = p.standardColumn?.firstLine ? p.standardColumn.firstLine - 1 : 0;
  return {
    start: Math.max(0, p.span.startWord - Math.round(linesAbove * wordsPerLine)),
    end: p.span.endWord + Math.round(linesBelow * wordsPerLine),
  };
}

function gapBeforeWord(text: TorahText, word: number): NavLineHint["gapBefore"] {
  if (text.petuchaBefore.has(word)) return "petucha";
  if (text.gapBefore.has(word)) return "setuma";
  return "none";
}

function lineHint(p: Placement, target: NavTarget, ctx: NavContext, lineStarts: Array<number | null> | undefined): NavLineHint {
  const { text, layout } = ctx;
  const firstWords = text.slice(target.word, target.word + 3);
  const gap = gapBeforeWord(text, target.word);

  // 1. standard layout: exact line and vocalized words
  if (p.standardColumn && layout) {
    const col = layout.columns[p.standardColumn.column - 1];
    const li = col?.lines.findIndex((l) => target.word >= l.start && target.word <= l.end);
    if (col && li !== undefined && li >= 0) {
      const line = col.lines[li]!;
      const offset = target.word - line.start;
      const vocalized = line.text.split(" ").slice(offset, offset + 3).join(" ") || null;
      return { line: li + 1, exact: true, firstWords, firstWordsVocalized: vocalized, gapBefore: gap, atLineStart: line.start === target.word };
    }
  }
  // 2. within the transcribed lines: the OCR line containing the word
  if (lineStarts && lineStarts.length > 0) {
    const firstLine = p.standardColumn?.firstLine ?? 1;
    for (let i = 0; i < lineStarts.length; i++) {
      const s = lineStarts[i];
      const next = lineStarts.slice(i + 1).find((x): x is number => x !== null);
      if (s !== null && s !== undefined && target.word >= s && (next === undefined || target.word < next)) {
        return { line: firstLine + i, exact: true, firstWords, firstWordsVocalized: null, gapBefore: gap, atLineStart: s === target.word };
      }
    }
  }
  // 3. estimate from words per line
  const wordsPerLine = p.layout.wordsPerLine > 0 ? p.layout.wordsPerLine : 8;
  const fromTop = (p.standardColumn?.firstLine ?? 1) + (target.word - p.span.startWord) / wordsPerLine;
  return { line: Math.max(1, Math.round(fromTop)), exact: false, firstWords, firstWordsVocalized: null, gapBefore: gap, atLineStart: false };
}

/**
 * Computes navigation from the scanned position to the target.
 * `lineStarts` is the scan's per-line alignment, if available.
 */
export function navigate(p: Placement, target: NavTarget, ctx: NavContext, lineStarts?: Array<number | null>): Navigation {
  const { layout } = ctx;
  const span = columnSpan(p, layout);
  const wordDelta = target.word - p.span.startWord;

  if (target.word >= span.start && target.word <= span.end) {
    const line = lineHint(p, target, ctx, lineStarts);
    return { status: "here", direction: null, wordDelta, columns: 0, columnsExact: line.exact, wordsPerColumnUsed: null, line };
  }

  const direction: NavDirection = target.word < p.span.startWord ? "towards-bereshit" : "towards-devarim";

  // exact with the standard layout, estimated otherwise
  let columns: number | null = null;
  let exact = false;
  let wordsPerColumnUsed: number | null = null;
  if (p.standardColumn && layout) {
    const targetCol = layout.columns.find((c) => target.word >= c.startWord && target.word <= c.endWord);
    if (targetCol) {
      columns = Math.abs(targetCol.n - p.standardColumn.column);
      exact = true;
    }
  }
  if (columns === null) {
    const wpc = ctx.learnedWordsPerColumn ?? p.layout.wordsPerColumn ?? (p.layout.wordsPerLine > 0 ? Math.round(p.layout.wordsPerLine * 42) : null);
    if (wpc && wpc > 0) {
      wordsPerColumnUsed = wpc;
      columns = Math.max(1, Math.round(Math.abs(target.word - span.start) / wpc));
    }
  }

  return { status: "move", direction, wordDelta, columns, columnsExact: exact, wordsPerColumnUsed, line: null };
}

/** Builds a target starting at a verse. */
export function targetFromVerse(text: TorahText, ref: VerseRef, label: string): NavTarget | null {
  const word = text.startOfVerse(ref);
  if (word < 0) return null;
  return { word, label, ref };
}
