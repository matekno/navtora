/**
 * Minimal image primitives on typed arrays. Runs the same in the browser and
 * in Node, with no dependencies.
 */

/** Single-channel image, row-major. For gray images 0 is black; for ink maps 0 is no ink. */
export interface Plane {
  width: number;
  height: number;
  data: Float32Array;
}

export function makePlane(width: number, height: number): Plane {
  return { width, height, data: new Float32Array(width * height) };
}

/** Luminance in [0, 255] from interleaved RGB or RGBA bytes. */
export function toGray(bytes: Uint8Array | Uint8ClampedArray, width: number, height: number, channels: 3 | 4 = 4): Plane {
  const out = makePlane(width, height);
  const d = out.data;
  for (let i = 0, p = 0; i < d.length; i++, p += channels) {
    d[i] = 0.2126 * bytes[p]! + 0.7152 * bytes[p + 1]! + 0.0722 * bytes[p + 2]!;
  }
  return out;
}

/** Area-averaging downscale by an integer-free factor; bilinear when enlarging. */
export function resize(src: Plane, width: number, height: number): Plane {
  if (width === src.width && height === src.height) return { width, height, data: src.data.slice() };
  if (width >= src.width || height >= src.height) return resizeBilinear(src, width, height);
  const out = makePlane(width, height);
  const sx = src.width / width;
  const sy = src.height / height;
  for (let y = 0; y < height; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < width; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let sum = 0;
      for (let yy = y0; yy < y1; yy++) {
        const row = yy * src.width;
        for (let xx = x0; xx < x1; xx++) sum += src.data[row + xx]!;
      }
      out.data[y * width + x] = sum / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}

export function resizeBilinear(src: Plane, width: number, height: number): Plane {
  const out = makePlane(width, height);
  const sx = src.width / width;
  const sy = src.height / height;
  for (let y = 0; y < height; y++) {
    const fy = (y + 0.5) * sy - 0.5;
    for (let x = 0; x < width; x++) {
      out.data[y * width + x] = sample(src, (x + 0.5) * sx - 0.5, fy);
    }
  }
  return out;
}

/** Bilinear sample with edge clamping. */
export function sample(src: Plane, x: number, y: number): number {
  const w = src.width;
  const h = src.height;
  const cx = Math.min(Math.max(x, 0), w - 1);
  const cy = Math.min(Math.max(y, 0), h - 1);
  const x0 = Math.floor(cx);
  const y0 = Math.floor(cy);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const ax = cx - x0;
  const ay = cy - y0;
  const d = src.data;
  const top = d[y0 * w + x0]! * (1 - ax) + d[y0 * w + x1]! * ax;
  const bottom = d[y1 * w + x0]! * (1 - ax) + d[y1 * w + x1]! * ax;
  return top * (1 - ay) + bottom * ay;
}

/** Separable box blur with the given radius, clamped at the edges. */
export function boxBlur(src: Plane, radius: number): Plane {
  if (radius <= 0) return { ...src, data: src.data.slice() };
  const { width: w, height: h } = src;
  const tmp = new Float32Array(w * h);
  const out = makePlane(w, h);
  const win = 2 * radius + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let k = -radius; k <= radius; k++) acc += src.data[row + clamp(k, 0, w - 1)]!;
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / win;
      acc += src.data[row + clamp(x + radius + 1, 0, w - 1)]! - src.data[row + clamp(x - radius, 0, w - 1)]!;
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -radius; k <= radius; k++) acc += tmp[clamp(k, 0, h - 1) * w + x]!;
    for (let y = 0; y < h; y++) {
      out.data[y * w + x] = acc / win;
      acc += tmp[clamp(y + radius + 1, 0, h - 1) * w + x]! - tmp[clamp(y - radius, 0, h - 1) * w + x]!;
    }
  }
  return out;
}

/** Separable maximum filter (grayscale dilation) with the given radius. */
export function maxFilter(src: Plane, radius: number): Plane {
  const { width: w, height: h } = src;
  const tmp = new Float32Array(w * h);
  const out = makePlane(w, h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let m = -Infinity;
      for (let k = Math.max(0, x - radius); k <= Math.min(w - 1, x + radius); k++) m = Math.max(m, src.data[row + k]!);
      tmp[row + x] = m;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let m = -Infinity;
      for (let k = Math.max(0, y - radius); k <= Math.min(h - 1, y + radius); k++) m = Math.max(m, tmp[k * w + x]!);
      out.data[y * w + x] = m;
    }
  }
  return out;
}

/** 1-D Gaussian smoothing of a profile. */
export function smooth1d(values: Float32Array | number[], sigma: number): Float32Array {
  const n = values.length;
  const out = new Float32Array(n);
  if (sigma <= 0) {
    for (let i = 0; i < n; i++) out[i] = values[i]!;
    return out;
  }
  const r = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(2 * r + 1);
  let ks = 0;
  for (let k = -r; k <= r; k++) {
    const v = Math.exp(-(k * k) / (2 * sigma * sigma));
    kernel[k + r] = v;
    ks += v;
  }
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += values[clamp(i + k, 0, n - 1)]! * kernel[k + r]!;
    out[i] = acc / ks;
  }
  return out;
}

/** Value at the given quantile (0..1) of the data, by sorting a sample. */
export function quantile(data: Float32Array | number[], q: number, maxSample = 50_000): number {
  const n = data.length;
  if (n === 0) return 0;
  const step = Math.max(1, Math.floor(n / maxSample));
  const s: number[] = [];
  for (let i = 0; i < n; i += step) s.push(data[i]!);
  s.sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]!;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
