/**
 * Oracle provider for evaluation: ignores the image and returns the true text of
 * a standard-layout column, optionally with simulated noise. Tests the full
 * pipeline without paying for OCR and measures the matcher in isolation.
 */
import { noisyLines, tokenizeHebrew, type LayoutData } from "@navtora/core";
import type { OcrImage, OcrOutput, OcrProvider } from "./provider";

export interface OracleOptions {
  layout: LayoutData;
  /** maps an image to its column number; in eval this comes from the file name */
  columnOf: (image: OcrImage) => number;
  charErrorRate?: number;
  seed?: number;
}

export class OracleOcr implements OcrProvider {
  readonly name = "oracle";
  constructor(private readonly opts: OracleOptions) {}

  async recognize(image: OcrImage): Promise<OcrOutput> {
    const column = this.opts.columnOf(image);
    const col = this.opts.layout.columns[column - 1];
    if (!col) throw new Error(`Column out of range: ${column}`);
    const clean = col.lines.map((l) => tokenizeHebrew(l.text).join(" "));
    const lines = this.opts.charErrorRate ? noisyLines(clean, { charErrorRate: this.opts.charErrorRate, seed: this.opts.seed ?? column }) : clean;
    return {
      result: {
        lines: lines.map((text, i) => ({ text, uncertain: false, gapBefore: col.lines[i]?.petucha ? "full" : col.lines[i]?.gap ? "partial" : "none" })),
        lineCountVisible: col.lines.length,
      },
      meta: { provider: this.name, ms: 0 },
    };
  }
}
