/**
 * What the reader produced for the photo in the "how it works" post, written by
 * tools/eval/src/blog-figures.ts. The overlays in the post are drawn from this.
 */
import raw from "./how-it-works-figures.json";

export type PairKind = "same" | "confusable" | "wildcard" | "different" | "extra";

export interface FigureLine {
  /** the line's center path, one point per strip */
  xs: number[];
  ys: number[];
  x0: number;
  x1: number;
  cut: boolean;
  /** where its crop is in lines.webp */
  crop: { width: number; top: number };
  /** what the network read; letters it wasn't sure of are `?` */
  text: string;
  /** each word read: the time steps (4 crop pixels each) of its first and last letter */
  words: Array<[number, number]>;
  confidence: number;
  /** index among the lines sent to the matcher, null if it read nothing */
  ocrLine: number | null;
}

export interface Figures {
  source: string;
  width: number;
  height: number;
  pitch: number;
  band: number;
  /** ink summed down each x, normalized, 160 samples across the photo */
  profile: number[];
  edges: Array<{ y: number; x0: number; x1: number }>;
  strips: { x: number[]; side: Array<{ x0: number; x1: number; profile: number[] }> };
  lines: FigureLine[];
  cropHeight: number;
  cropWidth: number;
  /** per time step of one line: the best class ("" = blank) and its probability; and its first two words, as read and in the scroll */
  ctc: { line: number; steps: Array<{ c: string; p: number }>; read: string[]; truth: string[] };
  tokens: number;
  /** votes for where the photo starts, over the whole Torah: the strongest 4-word bin in each of 240 buckets, normalized */
  votes: number[];
  torahWords: number;
  /** first word of each book */
  books: number[];
  /** the winning alignment: k is the word's position among all the words read */
  alignment: Array<{ k: number; line: number; read: string; word: string | null; position: number | null; kind: PairKind }>;
  /** a rare word read right: its position among the words read, where it is in the Torah, and how often it and a common word occur */
  voteExample: { word: string; k: number; position: number; origin: number; count: number; common: string; commonCount: number };
  result: {
    status: string;
    column: number | null;
    book: { en: string; he: string; es: string };
    parasha: { en: string; he: string; es: string } | null;
    verses: { start: { book: number; chapter: number; verse: number }; end: { book: number; chapter: number; verse: number } };
    span: { startWord: number; endWord: number };
    score: number;
    second: number | null;
    margin: number;
    alignedTokens: number;
    linesCovered: number;
  };
  navigation: { target: { book: number; chapter: number; verse: number }; targetColumn: number; direction: string; columns: number; exact: boolean };
  ms: { ink: number; segment: number; crop: number; vision: number; model: number };
}

export const FIG = raw as Figures;

/** How a word as read compares to the scroll's word, as a color. */
export const KIND_COLOR: Record<PairKind, string> = {
  same: "var(--color-ok)",
  confusable: "var(--color-accent)",
  wildcard: "var(--color-accent)",
  different: "var(--color-bad)",
  extra: "var(--color-muted)",
};

/** Center of a line at x, interpolating along its path and extrapolating past its ends. */
export function lineYAt(line: Pick<FigureLine, "xs" | "ys">, x: number): number {
  const { xs, ys } = line;
  if (xs.length === 1) return ys[0]!;
  let i = 0;
  while (i < xs.length - 2 && x > xs[i + 1]!) i++;
  const t = (x - xs[i]!) / (xs[i + 1]! - xs[i]! || 1);
  return ys[i]! + t * (ys[i + 1]! - ys[i]!);
}

/** Column edges at row y, interpolated between the rows where they were measured (and extrapolated past them). */
export function edgesAt(y: number): [number, number] {
  const e = FIG.edges;
  if (e.length === 1) return [e[0]!.x0, e[0]!.x1];
  let i = 0;
  while (i < e.length - 2 && y > e[i + 1]!.y) i++;
  const a = e[i]!;
  const b = e[i + 1]!;
  const t = (y - a.y) / (b.y - a.y || 1);
  return [a.x0 + t * (b.x0 - a.x0), a.x1 + t * (b.x1 - a.x1)];
}

/** Points along a line from x0 to x1 (by default its first and last ink), at `step` px. */
export function linePoints(line: FigureLine, offset = 0, step = 8, x0 = line.x0, x1 = line.x1): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let x = x0; x < x1; x += step) pts.push([x, lineYAt(line, x) + offset]);
  pts.push([x1, lineYAt(line, x1) + offset]);
  return pts;
}

/**
 * Where each word read sits on the photo, as [left, right] x. The crop runs
 * from the line's right end leftwards, a time step is 4 crop pixels, and
 * neighboring words split the space between them.
 */
export function wordSpans(line: FigureLine): Array<[number, number]> {
  const scale = FIG.band / FIG.cropHeight;
  const u = line.words.map(([a, b]) => [a * 4, (b + 1) * 4] as const);
  const cuts = [0, ...u.slice(1).map(([a], i) => (u[i]![1] + a) / 2), line.crop.width];
  return u.map((_, i) => [line.x1 - cuts[i + 1]! * scale, line.x1 - cuts[i]! * scale]);
}

export const fmtPoints = (pts: Array<[number, number]>) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** The words of each line as read, with how each compares to the scroll's word (null outside the alignment). */
export function lineWords(): Array<Array<{ read: string; kind: PairKind | null }>> {
  const byK = new Map(FIG.alignment.map((a) => [a.k, a.kind]));
  let k = 0;
  return FIG.lines.map((l) => {
    const words = l.text.split(" ").filter(Boolean);
    // lines that read nothing were not sent to the matcher and have no word positions
    if (l.ocrLine === null) return words.map((read) => ({ read, kind: null }));
    return words.map((read) => ({ read, kind: byK.get(k++) ?? null }));
  });
}
