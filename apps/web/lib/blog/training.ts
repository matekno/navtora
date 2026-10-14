/**
 * The synthetic training photos shown in the "how it works" post's training
 * appendix, written by tools/train/blog_figures.py next to the images in
 * public/blog/how-it-works/training/.
 */
import raw from "./training-figures.json";

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
