/** Shared engine types. No platform dependencies. */

export interface VerseRef {
  /** 1 Bereshit, 2 Shemot, 3 Vayikra, 4 Bamidbar, 5 Devarim */
  book: number;
  chapter: number;
  verse: number;
}

/** Torah text, produced by @navtora/data as dist/torah.json */
export interface TorahData {
  source: { repo: string; commit: string };
  wordCount: number;
  /** consonantal words in scroll order */
  words: string[];
  /** verse index for each word */
  wordVerse: number[];
  /** verses in order, with their first word index */
  verses: Array<{ book: number; chapter: number; verse: number; start: number }>;
  /** word indices preceded by a petuchah break */
  petuchaBefore: number[];
  /** word indices preceded by an in-line gap (typically a setumah) */
  gapBefore: number[];
}

/** Standard 245-column layout, dist/layout-245.json */
export interface LayoutData {
  columns: Array<{
    n: number;
    startWord: number;
    endWord: number;
    lines: Array<{ start: number; end: number; text: string; petucha: boolean; gap: boolean }>;
  }>;
}

export interface AliyahData {
  /** 1..7, or "M" for maftir */
  n: number | "M";
  startWord: number;
  endWord: number;
  start: VerseRef;
  end: VerseRef;
}

export interface ParashaData {
  n: number;
  name: { en: string; he: string; es: string };
  book: number;
  startWord: number;
  endWord: number;
  start: VerseRef;
  end: VerseRef;
  aliyot: AliyahData[];
}

export type ParashotData = ParashaData[];

/** OCR output: one entry per visual line of the scroll, in reading order. */
export interface OcrLine {
  text: string;
  /** the OCR is unsure about this line */
  uncertain?: boolean;
  /** blank space before the line: none, partial (setumah) or a full line (petuchah) */
  gapBefore?: "none" | "partial" | "full";
}

export interface OcrResult {
  lines: OcrLine[];
  /** lines visible in the column, even if not all were transcribed */
  lineCountVisible?: number;
}

export type ConfidenceStatus = "confident" | "ambiguous" | "insufficient";

export interface AlignmentCandidate {
  startWord: number;
  endWord: number;
  score: number;
  /** aligned tokens / total tokens */
  coverage: number;
  alignedTokens: number;
  linesCovered: number;
  /** for each OCR line, the index of its first aligned word, or null */
  lineStarts: Array<number | null>;
}

export interface LayoutEstimate {
  linesTranscribed: number;
  linesVisible: number;
  wordsPerLine: number;
  /** estimated words per column, if the photo shows a full column */
  wordsPerColumn: number | null;
}

export interface StandardColumnMatch {
  column: number;
  /** the first transcribed line is the start of the column */
  fromColumnStart: boolean;
  /** line (1..42) of the standard column where the first OCR line starts */
  firstLine: number | null;
}

export interface Placement {
  span: { startWord: number; endWord: number };
  book: { n: number; name: { en: string; he: string; es: string } };
  /** parashot overlapping the span, in order; almost always one */
  parashot: Array<{ n: number; name: { en: string; he: string; es: string } }>;
  /** aliyot overlapping the span */
  aliyot: Array<{ parasha: number; parashaName: { en: string; he: string; es: string }; n: number | "M"; startsHere: boolean }>;
  verses: { start: VerseRef; end: VerseRef };
  /** first aligned words, consonantal */
  firstWords: string;
  /** first words with nikkud, if the span falls in the standard layout */
  firstWordsVocalized: string | null;
  standardColumn: StandardColumnMatch | null;
  layout: LayoutEstimate;
  confidence: { score: number; margin: number; alignedTokens: number; linesCovered: number; coverage: number };
}

/** Why a position was not asserted. The app localizes these codes. */
export type LocateReason = "few-words" | "no-match" | "few-aligned" | "single-line" | "low-coverage" | "similar-passages";

/** What to try next time. The app localizes these codes. */
export type LocateSuggestion = "move-closer" | "check-photo" | "more-light" | "include-gap" | "show-column-start";

export interface LocateResult {
  status: ConfidenceStatus;
  best: Placement | null;
  /** alternative candidates when ambiguous */
  alternatives: Placement[];
  reasons: LocateReason[];
  suggestions: LocateSuggestion[];
  debug?: {
    tokens: number;
    candidates: AlignmentCandidate[];
    elapsedMs: number;
  };
}
