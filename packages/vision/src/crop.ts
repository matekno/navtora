/**
 * Line crops for the recognizer: a fixed-height strip of ink intensity that
 * follows the line's path, mirrored so that the first letter in reading order
 * (the rightmost one) comes first. The recognizer's output is then already in
 * logical order.
 */
import { boxBlur, sample, type Plane } from "./image";
import { lineYAt, type ColumnLayout, type TextLine } from "./segment";

export const LINE_HEIGHT = 32;
export const MAX_LINE_WIDTH = 1600;

export interface LineCrop {
  width: number;
  height: number;
  /** row-major ink intensity in [0, 1], first column = rightmost ink */
  data: Float32Array;
}

/** The ink map blurred just enough to avoid aliasing when shrinking lines to LINE_HEIGHT. */
export function prefilterFor(ink: Plane, layout: ColumnLayout, height = LINE_HEIGHT): Plane {
  const radius = Math.floor(layout.band / height / 2);
  return radius >= 1 ? boxBlur(ink, radius) : ink;
}

export function cropLine(ink: Plane, layout: ColumnLayout, line: TextLine, height = LINE_HEIGHT): LineCrop {
  const scale = layout.band / height;
  const width = Math.max(8, Math.min(MAX_LINE_WIDTH, Math.round((line.x1 - line.x0) / scale)));
  const data = new Float32Array(width * height);
  for (let u = 0; u < width; u++) {
    // mirrored: u = 0 is the right end of the line
    const x = line.x1 - (u + 0.5) * scale;
    const top = lineYAt(line, x) - layout.band / 2;
    for (let v = 0; v < height; v++) {
      const y = top + (v + 0.5) * scale;
      data[v * width + u] = y < 0 || y > ink.height - 1 ? 0 : sample(ink, x, y);
    }
  }
  return { width, height, data };
}
