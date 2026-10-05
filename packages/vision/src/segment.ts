/**
 * Finds the column under the camera and its text lines.
 *
 * A sefer column is close to a grid: lines are ruled (sirtut), evenly spaced
 * and parallel. The work is done on projection profiles. Summing ink down the
 * photo (along the direction that makes the profile sharpest, in case the
 * phone was rotated) finds the column between its blank margins. The column
 * is then cut into strips; summing ink along the rows of a strip gives one
 * peak per line. Comparing neighboring strips tells how much the lines rise
 * or fall from one strip to the next, which follows tilt and the curvature of
 * the parchment. Adding the strips back with those offsets gives sharp peaks,
 * one per line, spaced by the line pitch.
 */
import { quantile, resize, smooth1d, type Plane } from "./image";

export interface TextLine {
  /** center of the line at the column's middle strip, in image pixels */
  y: number;
  /** points of the line's center path: (xs[i], ys[i]), one per strip, left to right */
  xs: number[];
  ys: number[];
  /** horizontal extent of the ink */
  x0: number;
  x1: number;
  /** a blank line or more before this one */
  gapBefore: "none" | "full";
  /** the line's band reaches the edge of the photo, so the line is probably cut */
  cut: boolean;
}

/** Column edges measured at a few rows; between them they are interpolated linearly. */
export interface ColumnBounds {
  edges: Array<{ y: number; x0: number; x1: number }>;
}

export interface ColumnLayout extends ColumnBounds {
  /** distance between consecutive lines, in pixels */
  pitch: number;
  /** height of the band cropped around each line, in pixels */
  band: number;
  lines: TextLine[];
}

/** Center of `line` at horizontal position x, interpolating along its path (and extrapolating past the ends). */
export function lineYAt(line: TextLine, x: number): number {
  const xs = line.xs;
  const n = xs.length;
  if (n === 1) return line.ys[0]!;
  let i = 0;
  while (i < n - 2 && x > xs[i + 1]!) i++;
  const t = (x - xs[i]!) / (xs[i + 1]! - xs[i]! || 1);
  return line.ys[i]! + t * (line.ys[i + 1]! - line.ys[i]!);
}

/** Left and right edges of the column at row y. */
export function columnEdgesAt(c: ColumnBounds, y: number): [number, number] {
  const e = c.edges;
  if (e.length === 1) return [e[0]!.x0, e[0]!.x1];
  let i = 0;
  while (i < e.length - 2 && y > e[i + 1]!.y) i++;
  const a = e[i]!;
  const b = e[i + 1]!;
  const t = (y - a.y) / (b.y - a.y || 1);
  return [a.x0 + t * (b.x0 - a.x0), a.x1 + t * (b.x1 - a.x1)];
}

/** Ink summed along columns sheared by `slant` (x' = x - (y - yRef) * slant), over rows [y0, y1). */
function shearedColumnProfile(ink: Plane, slant: number, yRef: number, y0 = 0, y1 = ink.height): Float32Array {
  const w = ink.width;
  const prof = new Float32Array(w);
  for (let y = y0; y < y1; y++) {
    const row = y * w;
    const off = (y - yRef) * slant;
    for (let x = 0; x < w; x++) {
      const v = ink.data[row + x]!;
      if (v === 0) continue;
      const xp = Math.round(x - off);
      if (xp >= 0 && xp < w) prof[xp] = prof[xp]! + v;
    }
  }
  return prof;
}

/** Edges of the text run around `cx` in a column profile, bounded by blank gaps; null if too narrow. */
function columnRun(prof: Float32Array, cx: number): { x0: number; x1: number } | null {
  const w = prof.length;
  const sm = smooth1d(prof, Math.max(0.7, w / 400));
  const level = quantile(Array.from(sm.slice(Math.round(w * 0.4), Math.round(w * 0.6))), 0.5);
  if (level <= 0) return null;
  const low = (x: number) => sm[x]! < 0.25 * level;
  const blank = (x: number) => sm[x]! < 0.1 * level;
  // a gap is a fairly empty run of some width, or a narrow but almost blank one
  const gapMin = Math.max(3, Math.round(w * 0.012));
  const blankMin = Math.max(2, Math.round(w * 0.006));
  // start from cx, or from the nearest dense x if it falls in a gap
  let c = Math.round(cx);
  if (low(c)) {
    for (let d = 1; d < w / 2; d++) {
      if (c - d >= 0 && !low(c - d)) {
        c -= d;
        break;
      }
      if (c + d < w && !low(c + d)) {
        c += d;
        break;
      }
    }
  }
  const walk = (dir: -1 | 1): number => {
    let run = 0;
    let blankRun = 0;
    for (let x = c; x >= 0 && x < w; x += dir) {
      run = low(x) ? run + 1 : 0;
      blankRun = blank(x) ? blankRun + 1 : 0;
      if (run >= gapMin) return x - dir * (run - 1); // inner edge of the gap
      if (blankRun >= blankMin) return x - dir * (blankRun - 1);
    }
    return dir < 0 ? 0 : w - 1;
  };
  let x0 = walk(-1);
  let x1 = walk(1);
  while (x0 < x1 && low(x0)) x0++;
  while (x1 > x0 && low(x1)) x1--;
  return x1 - x0 >= w * 0.12 ? { x0, x1 } : null;
}

/**
 * The text column that contains the middle of the photo, bounded by blank
 * gaps. The edges are measured in horizontal bands, so they can lean apart
 * (perspective) as well as tilt (rotation).
 */
export function findColumn(ink: Plane): ColumnBounds | null {
  // the search runs on a small copy
  const f = Math.min(1, 360 / ink.width);
  const small = f < 1 ? resize(ink, Math.max(1, Math.round(ink.width * f)), Math.max(1, Math.round(ink.height * f))) : ink;
  const h = small.height;
  const yRef = h / 2;
  const sharpness = (slant: number) => {
    const p = shearedColumnProfile(small, slant, yRef);
    let s = 0;
    for (let i = 0; i < p.length; i++) s += p[i]! * p[i]!;
    return s;
  };
  let bestDeg = 0;
  let bestScore = sharpness(0);
  for (let d = -8; d <= 8.001; d += 0.5) {
    const s = sharpness(Math.tan((d * Math.PI) / 180));
    if (s > bestScore * 1.0001) {
      bestScore = s;
      bestDeg = d;
    }
  }
  for (let d = bestDeg - 0.4; d <= bestDeg + 0.401; d += 0.1) {
    const s = sharpness(Math.tan((d * Math.PI) / 180));
    if (s > bestScore * 1.0001) {
      bestScore = s;
      bestDeg = d;
    }
  }
  const slant = Math.tan((bestDeg * Math.PI) / 180);
  const cx = small.width / 2;

  const B = Math.max(1, Math.min(5, Math.floor(h / 60)));
  const found: Array<{ y: number; x0: number; x1: number }> = [];
  for (let b = 0; b < B; b++) {
    const y0 = Math.floor((b * h) / B);
    const y1 = Math.floor(((b + 1) * h) / B);
    const yc = (y0 + y1) / 2;
    // the band's own center follows the slant
    const run = columnRun(shearedColumnProfile(small, slant, yRef, y0, y1), cx);
    if (run) {
      const off = (yc - yRef) * slant;
      found.push({ y: yc, x0: run.x0 + off, x1: run.x1 + off });
    }
  }
  if (found.length === 0) return null;
  // drop bands that disagree with the others (a stain, a blank band, a merged neighbor)
  const medW = quantile(found.map((e) => e.x1 - e.x0), 0.5);
  const medC = quantile(found.map((e) => (e.x0 + e.x1) / 2), 0.5);
  const good = found.filter((e) => Math.abs(e.x1 - e.x0 - medW) <= 0.25 * medW && Math.abs((e.x0 + e.x1) / 2 - medC) <= 0.2 * medW);
  const edges = (good.length > 0 ? good : found).map((e) => ({ y: e.y / f, x0: e.x0 / f, x1: e.x1 / f }));
  if (edges.length === 1) {
    // a single band: extend it along the slant
    const e = edges[0]!;
    const d = 100;
    edges.splice(0, 1, { y: e.y - d, x0: e.x0 - d * slant, x1: e.x1 - d * slant }, { y: e.y + d, x0: e.x0 + d * slant, x1: e.x1 + d * slant });
  }
  return { edges };
}

/** Row profile of ink inside a strip of the column, between fractions a and b of its width. */
function stripProfile(ink: Plane, col: ColumnBounds, a: number, b: number): Float32Array {
  const { width: w, height: h } = ink;
  const prof = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    const [e0, e1] = columnEdgesAt(col, y);
    const xa = Math.max(0, Math.round(e0 + a * (e1 - e0)));
    const xb = Math.min(w - 1, Math.round(e0 + b * (e1 - e0)) - 1);
    const row = y * w;
    let s = 0;
    for (let x = xa; x <= xb; x++) s += ink.data[row + x]!;
    prof[y] = s;
  }
  return prof;
}

/** Line pitch from autocorrelation, averaged over several profiles. */
export function estimatePitch(profiles: Float32Array[], minLag = 6): number | null {
  const n = profiles[0]?.length ?? 0;
  const maxLag = Math.floor(n / 3);
  if (maxLag <= minLag + 2) return null;
  const ac = new Float32Array(maxLag + 2);
  for (const prof of profiles) {
    let mean = 0;
    for (let i = 0; i < n; i++) mean += prof[i]!;
    mean /= n;
    let norm = 0;
    for (let i = 0; i < n; i++) norm += (prof[i]! - mean) ** 2;
    if (norm <= 0) continue;
    for (let lag = minLag; lag <= maxLag + 1; lag++) {
      let s = 0;
      for (let i = 0; i + lag < n; i++) s += (prof[i]! - mean) * (prof[i + lag]! - mean);
      ac[lag] = ac[lag]! + s / norm;
    }
  }
  const peaks: Array<{ lag: number; v: number }> = [];
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (ac[lag]! > 0 && ac[lag]! >= ac[lag - 1]! && ac[lag]! > ac[lag + 1]!) peaks.push({ lag, v: ac[lag]! });
  }
  if (peaks.length === 0) return null;
  const top = peaks.reduce((a, b) => (b.v > a.v ? b : a));
  // the strongest peak can be a multiple of the pitch; take the first strong one
  const first = peaks.find((p) => p.v >= 0.5 * top.v) ?? top;
  const a = ac[first.lag - 1]!;
  const b = ac[first.lag]!;
  const c = ac[first.lag + 1]!;
  const denom = a - 2 * b + c;
  return first.lag + (denom !== 0 ? (0.5 * (a - c)) / denom : 0);
}

/** Shift d (|d| <= maxShift) that best aligns profile b(y + d) with a(y), restricted to rows [y0, y1). */
function bestShift(a: Float32Array, b: Float32Array, maxShift: number, y0: number, y1: number): number {
  let best = 0;
  let bestScore = -Infinity;
  const n = a.length;
  for (let d = -maxShift; d <= maxShift; d++) {
    let s = 0;
    for (let y = Math.max(y0, -d); y < Math.min(y1, n - d); y++) s += a[y]! * b[y + d]!;
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  }
  return best;
}

export interface SegmentOptions {
  /** band height to crop, in pitches */
  bandPitches?: number;
  /** number of strips; by default about one per 6 line pitches of width */
  strips?: number;
}

/** Column, line pitch and lines of a photo, from its ink map. */
export function segmentColumn(ink: Plane, opts: SegmentOptions = {}): ColumnLayout | null {
  const col = findColumn(ink);
  if (!col) return null;
  const { height: h } = ink;
  const [m0, m1] = columnEdgesAt(col, h / 2);
  const colW = m1 - m0;

  // pitch from a few coarse strips (tilt barely matters over a narrow strip)
  const coarse = 6;
  const coarseProfiles: Float32Array[] = [];
  for (let k = 0; k < coarse; k++) coarseProfiles.push(smooth1d(stripProfile(ink, col, k / coarse, (k + 1) / coarse), 1));
  const pitch = estimatePitch(coarseProfiles);
  if (!pitch || pitch < 6) return null;

  const K = opts.strips ?? Math.max(3, Math.min(12, Math.round(colW / (pitch * 6))));
  const profiles: Float32Array[] = [];
  for (let k = 0; k < K; k++) profiles.push(smooth1d(stripProfile(ink, col, k / K, (k + 1) / K), Math.max(1, pitch / 8)));
  const stripX = (k: number, y: number) => {
    const [e0, e1] = columnEdgesAt(col, y);
    return e0 + ((k + 0.5) / K) * (e1 - e0);
  };

  // where the text is, vertically: rows whose summed profile is above a floor
  const total = new Float32Array(h);
  for (const p of profiles) for (let y = 0; y < h; y++) total[y] = total[y]! + p[y]!;
  const floor = 0.15 * quantile(total, 0.9);
  let textTop = 0;
  let textBottom = h - 1;
  while (textTop < h - 1 && total[textTop]! < floor) textTop++;
  while (textBottom > textTop && total[textBottom]! < floor) textBottom--;

  // blocks of rows, so the line shape can change from top to bottom (perspective)
  const textH = textBottom - textTop + 1;
  const B = Math.max(1, Math.min(3, Math.floor(textH / (pitch * 12))));
  const blockCenters: number[] = [];
  const shifts: number[][] = []; // shifts[b][k]: offset of strip k relative to the middle strip
  const maxStep = Math.max(1, Math.round(pitch * 0.4));
  const mid = Math.floor(K / 2);
  for (let bi = 0; bi < B; bi++) {
    const y0 = textTop + Math.floor((bi * textH) / B);
    const y1 = textTop + Math.floor(((bi + 1) * textH) / B);
    blockCenters.push((y0 + y1) / 2);
    const s = new Array<number>(K).fill(0);
    for (let k = mid + 1; k < K; k++) s[k] = s[k - 1]! + bestShift(profiles[k - 1]!, profiles[k]!, maxStep, y0, y1);
    for (let k = mid - 1; k >= 0; k--) s[k] = s[k + 1]! + bestShift(profiles[k + 1]!, profiles[k]!, maxStep, y0, y1);
    shifts.push(s);
  }
  const shiftAt = (y: number, k: number): number => {
    if (B === 1 || y <= blockCenters[0]!) return shifts[0]![k]!;
    if (y >= blockCenters[B - 1]!) return shifts[B - 1]![k]!;
    let bi = 0;
    while (bi < B - 2 && y > blockCenters[bi + 1]!) bi++;
    const t = (y - blockCenters[bi]!) / (blockCenters[bi + 1]! - blockCenters[bi]!);
    return shifts[bi]![k]! * (1 - t) + shifts[bi + 1]![k]! * t;
  };

  // combined profile in the middle strip's coordinates
  const combined = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let k = 0; k < K; k++) {
      const yy = Math.round(y + shiftAt(y, k));
      if (yy >= 0 && yy < h) s += profiles[k]![yy]!;
    }
    combined[y] = s;
  }
  const prof = smooth1d(combined, pitch / 6);

  // local maxima, strongest first, at least ~0.6 pitch apart
  const cands: number[] = [];
  for (let i = 1; i < h - 1; i++) {
    if (prof[i]! > 0 && prof[i]! >= prof[i - 1]! && prof[i]! > prof[i + 1]!) cands.push(i);
  }
  cands.sort((a, b) => prof[b]! - prof[a]!);
  const chosen: number[] = [];
  for (const c of cands) {
    if (chosen.every((o) => Math.abs(o - c) >= 0.6 * pitch)) chosen.push(c);
  }
  if (chosen.length === 0) return null;
  const heights = chosen.map((c) => prof[c]!).sort((a, b) => b - a);
  const ref = heights[Math.floor(Math.max(0, (heights.length - 1) * 0.25))]!;
  const valley = (from: number, to: number) => {
    let m = Infinity;
    for (let i = Math.max(0, from); i <= Math.min(h - 1, to); i++) m = Math.min(m, prof[i]!);
    return m;
  };
  const keep = chosen
    .filter((c) => {
      const v = prof[c]!;
      if (v < 0.15 * ref) return false;
      const left = valley(Math.round(c - pitch * 0.9), c);
      const right = valley(c, Math.round(c + pitch * 0.9));
      return v - Math.max(left, right) >= 0.12 * ref;
    })
    .sort((a, b) => a - b);

  const band = (opts.bandPitches ?? 1.1) * pitch;
  const layout: ColumnLayout = { edges: col.edges, pitch, band, lines: [] };
  let prev: number | null = null;
  for (const yc of keep) {
    const ys = profiles.map((_, k) => yc + shiftAt(yc, k));
    const xs = ys.map((y, k) => stripX(k, y));
    const line: TextLine = { y: ys[mid]!, xs, ys, x0: xs[0]!, x1: xs[K - 1]!, gapBefore: "none", cut: false };
    const extent = inkExtent(ink, layout, line);
    if (!extent) continue;
    line.x0 = extent.x0;
    line.x1 = extent.x1;
    const yA = lineYAt(line, line.x0);
    const yB = lineYAt(line, line.x1);
    line.cut = Math.min(yA, yB) - band / 2 < 0 || Math.max(yA, yB) + band / 2 > h - 1;
    line.gapBefore = prev !== null && yc - prev > 1.6 * pitch ? "full" : "none";
    layout.lines.push(line);
    prev = yc;
  }
  return layout.lines.length > 0 ? layout : null;
}

/** Where the ink of one line starts and ends, within the column edges (plus a small margin). */
function inkExtent(ink: Plane, layout: ColumnLayout, line: TextLine): { x0: number; x1: number } | null {
  const { width: w, height: h } = ink;
  const pitch = layout.pitch;
  const [e0, e1] = columnEdgesAt(layout, line.y);
  const margin = pitch * 0.3;
  const xs = Math.max(0, Math.round(e0 - margin));
  const xe = Math.min(w - 1, Math.round(e1 + margin));
  if (xe - xs < pitch) return null;
  const half = Math.max(1, Math.round(pitch * 0.35));
  const prof = new Float32Array(xe - xs + 1);
  for (let x = xs; x <= xe; x++) {
    const yc = Math.round(lineYAt(line, x));
    let s = 0;
    for (let yy = Math.max(0, yc - half); yy <= Math.min(h - 1, yc + half); yy++) s += ink.data[yy * w + x]!;
    prof[x - xs] = s;
  }
  const sm = smooth1d(prof, Math.max(1, pitch / 4));
  const thr = 0.12 * quantile(sm, 0.9);
  if (thr <= 0) return null;
  let a = -1;
  let b = -1;
  for (let i = 0; i < sm.length; i++) {
    if (sm[i]! > thr) {
      if (a < 0) a = i;
      b = i;
    }
  }
  if (a < 0 || b - a < pitch) return null;
  const pad = pitch * 0.3;
  return { x0: Math.max(0, xs + a - pad), x1: Math.min(w - 1, xs + b + pad) };
}
