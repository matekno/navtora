/**
 * Illumination normalization. Parchment brightness changes slowly across a
 * photo (shadows, a lamp on one side, yellowing) while ink changes abruptly.
 * The background is estimated on a small copy with a maximum filter, which
 * erases the ink, and the photo is divided by it. What remains is ink
 * intensity in [0, 1], independent of the lighting.
 */
import { boxBlur, makePlane, maxFilter, quantile, resize, resizeBilinear, type Plane } from "./image";

export interface InkOptions {
  /** long side of the copy where the background is estimated */
  backgroundSide?: number;
}

export function inkMap(gray: Plane, opts: InkOptions = {}): Plane {
  const side = opts.backgroundSide ?? 160;
  const scale = side / Math.max(gray.width, gray.height);
  const sw = Math.max(8, Math.round(gray.width * scale));
  const sh = Math.max(8, Math.round(gray.height * scale));
  const small = resize(gray, sw, sh);
  const bgSmall = boxBlur(maxFilter(small, 2), 2);
  const bg = resizeBilinear(bgSmall, gray.width, gray.height);

  const ink = makePlane(gray.width, gray.height);
  for (let i = 0; i < ink.data.length; i++) {
    const b = Math.max(bg.data[i]!, 8);
    const ratio = gray.data[i]! / b;
    ink.data[i] = ratio >= 1 ? 0 : 1 - ratio;
  }
  // stretch: the median is the parchment's noise floor, the top percentile is solid ink
  const lo = quantile(ink.data, 0.5);
  const hi = Math.max(lo + 0.05, quantile(ink.data, 0.995));
  const span = hi - lo;
  for (let i = 0; i < ink.data.length; i++) {
    const v = (ink.data[i]! - lo) / span;
    ink.data[i] = v <= 0 ? 0 : v >= 1 ? 1 : v;
  }
  return ink;
}
