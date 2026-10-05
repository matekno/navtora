import { describe, expect, it } from "vitest";
import { analyzeColumn, columnEdgesAt, lineYAt } from "../src";

/**
 * A fake photo: three columns of "words" (dark blocks) on a parchment that
 * gets darker to the right, rotated a little. Lines of the middle column are
 * at known positions.
 */
function fakePhoto(opts: { width: number; height: number; pitch: number; lines: number; angleDeg: number; seed: number }) {
  const { width: w, height: h, pitch, lines, angleDeg } = opts;
  let seed = opts.seed;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const colW = Math.round(w * 0.5);
  const gap = Math.round(pitch * 1.5);
  const x0 = Math.round((w - colW) / 2);
  const columns = [x0 - gap - colW, x0, x0 + colW + gap];
  const top = Math.round((h - lines * pitch) / 2);
  const letterH = Math.round(pitch * 0.45);
  // ink before rotation: words as blocks with gaps
  const ink = new Uint8Array(w * h);
  for (const cx of columns) {
    for (let l = 0; l < lines; l++) {
      const yc = top + l * pitch + pitch / 2;
      let x = cx + colW;
      while (x > cx) {
        const ww = Math.round(pitch * (0.8 + rnd() * 2));
        const x1 = Math.max(cx, x - ww);
        for (let y = Math.round(yc - letterH / 2); y < Math.round(yc + letterH / 2); y++) {
          for (let xx = x1; xx < x; xx++) if (xx >= 0 && xx < w && y >= 0 && y < h && rnd() < 0.6) ink[y * w + xx] = 1;
        }
        x = x1 - Math.round(pitch * 0.35);
      }
    }
  }
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // inverse rotation about the center
      const dx = x - w / 2;
      const dy = y - h / 2;
      const sx = Math.round(cos * dx + sin * dy + w / 2);
      const sy = Math.round(-sin * dx + cos * dy + h / 2);
      const isInk = sx >= 0 && sx < w && sy >= 0 && sy < h && ink[sy * w + sx] === 1;
      const paper = 230 - (60 * x) / w; // uneven light
      const v = isInk ? 40 : paper + (rnd() - 0.5) * 10;
      rgb.set([v, v * 0.95, v * 0.85], (y * w + x) * 3);
    }
  }
  const truthY = (l: number, x: number) => {
    const yc = top + l * pitch + pitch / 2;
    // forward rotation of (x', yc) to image space, solved for y at image x (small angle)
    return h / 2 + (yc - h / 2) / cos + Math.tan(a) * (x - w / 2);
  };
  return { rgb, w, h, colX: [x0, x0 + colW] as const, truthY, top };
}

describe("analyzeColumn", () => {
  it("finds the middle column, the pitch and every line on a straight photo", () => {
    const p = fakePhoto({ width: 900, height: 1200, pitch: 40, lines: 24, angleDeg: 0, seed: 1 });
    const res = analyzeColumn(p.rgb, p.w, p.h, 3);
    const L = res.layout!;
    expect(L).not.toBeNull();
    expect(L.pitch).toBeGreaterThan(38);
    expect(L.pitch).toBeLessThan(42);
    expect(L.lines.length).toBe(24);
    const [e0, e1] = columnEdgesAt(L, p.h / 2);
    expect(Math.abs(e0 - p.colX[0])).toBeLessThan(20);
    expect(Math.abs(e1 - p.colX[1])).toBeLessThan(20);
    L.lines.forEach((line, i) => {
      const xm = (line.x0 + line.x1) / 2;
      expect(Math.abs(lineYAt(line, xm) - p.truthY(i, xm))).toBeLessThan(5);
    });
    expect(res.crops).toHaveLength(24);
    expect(res.crops[0]!.height).toBe(32);
  });

  it("follows a rotated photo", () => {
    const p = fakePhoto({ width: 900, height: 1200, pitch: 36, lines: 26, angleDeg: 3, seed: 2 });
    const L = analyzeColumn(p.rgb, p.w, p.h, 3).layout!;
    expect(L).not.toBeNull();
    expect(Math.abs(L.pitch - 36)).toBeLessThan(2.5);
    expect(L.lines.length).toBeGreaterThanOrEqual(25);
    expect(L.lines.length).toBeLessThanOrEqual(26);
    // each detected line sits on a true line along its whole length
    for (const line of L.lines) {
      for (const x of [line.x0 + 20, (line.x0 + line.x1) / 2, line.x1 - 20]) {
        const y = lineYAt(line, x);
        const nearest = Math.min(...Array.from({ length: 26 }, (_, l) => Math.abs(p.truthY(l, x) - y)));
        expect(nearest).toBeLessThan(6);
      }
    }
  });

  it("returns no layout for a blank photo", () => {
    const w = 400;
    const h = 600;
    const rgb = new Uint8Array(w * h * 3).fill(220);
    expect(analyzeColumn(rgb, w, h, 3).layout).toBeNull();
  });
});
