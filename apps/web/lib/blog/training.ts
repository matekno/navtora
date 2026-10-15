/**
 * The figures of the post on how the network was trained: synthetic training
 * photos, written by tools/train/blog_figures.py next to the images in
 * public/blog/training/, and real sifrei read by the app, written by
 * tools/eval/src/blog-real.ts next to the images in public/blog/training/real/.
 */
import raw from "./training-figures.json";
import realRaw from "./real-sifrei.json";

export type SynthStage = "text" | "ink" | "parchment" | "camera" | "light" | "final";

export interface TrainingFigures {
  /** one training photo kept at every step of its making */
  stage: { index: number; column: number; family: string; lines: number; sizes: Record<SynthStage, [number, number]> };
  gallery: Array<{ file: string; width: number; height: number; column: number; family: string; shuffled: boolean; lines: number }>;
  /** fonts.webp: one row per font family, and the share of photos written in it */
  fonts: { width: number; rowHeight: number; rows: Array<{ family: string; share: number }> };
  /** crops.webp: line crops as the network gets them (flipped back to reading order) with the text they were labeled with */
  crops: { width: number; height: number; rows: Array<{ label: string; width: number; top: number; shuffled: boolean }> };
}

export const TRAIN = raw as TrainingFigures;

export const SYNTH_STAGES: SynthStage[] = ["text", "ink", "parchment", "camera", "light", "final"];

/** Font families as the fonts call themselves. */
export const FAMILY_NAMES: Record<string, string> = {
  StamAshkenaz: "Stam Ashkenaz",
  StamSefarad: "Stam Sefarad",
  KeterYG: "Keter YG",
  FrankRuehl: "Frank Ruehl",
  Drugulin: "Drugulin",
  Hadasim: "Hadasim",
  Shofar: "Shofar",
  David: "David",
  Simple: "Simple",
  Miriam: "Miriam",
  Nachlieli: "Nachlieli",
  Yehuda: "Yehuda",
};

type Names = { en: string; es: string; he: string };
type Verse = { book: number; chapter: number; verse: number };

/** One photo of a real sefer as the app read it: <id>.webp and <id>-analysis.webp in public/blog/training/real/. */
export interface RealRead {
  width: number;
  height: number;
  status: string;
  linesRead: number;
  parasha: Names | null;
  book: Names | null;
  column: number | null;
  verses: { start: Verse; end: Verse } | null;
  alignedWords: number;
  linesCovered: number;
  words: number;
  same: number;
}

const { "bl-sheet": sheet, ...reads } = realRaw;
/** what was read in each photo, by id */
export const REAL = reads as unknown as Record<string, RealRead>;
/** a whole sheet of the British Library scroll, shown as is */
export const BL_SHEET: { width: number; height: number } = sheet;
