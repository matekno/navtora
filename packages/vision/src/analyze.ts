/** From a photo to line crops: the whole classical pipeline in one call. */
import { cropLine, prefilterFor, type LineCrop } from "./crop";
import { resize, toGray, type Plane } from "./image";
import { inkMap } from "./ink";
import { segmentColumn, type ColumnLayout } from "./segment";

/** photos are reduced to this long side before analysis */
export const MAX_WORK_SIDE = 2000;

export interface ColumnAnalysis {
  /** size of the working image; layout coordinates are in this space */
  width: number;
  height: number;
  /** working image size / original size */
  scale: number;
  ink: Plane;
  layout: ColumnLayout | null;
  crops: LineCrop[];
  ms: { ink: number; segment: number; crop: number };
}

export function analyzeColumn(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number, channels: 3 | 4 = 4): ColumnAnalysis {
  const t0 = now();
  let gray = toGray(rgba, width, height, channels);
  const scale = Math.min(1, MAX_WORK_SIDE / Math.max(width, height));
  if (scale < 1) gray = resize(gray, Math.round(width * scale), Math.round(height * scale));
  const ink = inkMap(gray);
  const t1 = now();
  const layout = segmentColumn(ink);
  const t2 = now();
  const crops: LineCrop[] = [];
  if (layout) {
    const src = prefilterFor(ink, layout);
    for (const line of layout.lines) crops.push(cropLine(src, layout, line));
  }
  const t3 = now();
  return { width: gray.width, height: gray.height, scale, ink, layout, crops, ms: { ink: t1 - t0, segment: t2 - t1, crop: t3 - t2 } };
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
