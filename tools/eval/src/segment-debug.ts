/**
 * Runs the classical pipeline (ink map, column, lines) on images and writes an
 * overlay per image plus its line crops, to check segmentation by eye.
 *
 *   pnpm --filter @navtora/eval segment -- <image...> [--out dir] [--crop x,y,w,h]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { analyzeColumn, columnEdgesAt, lineYAt } from "@navtora/vision";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let out = "segment-debug";
  let crop: [number, number, number, number] | null = null;
  const files: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--out") out = argv[++i]!;
    else if (a === "--crop") crop = argv[++i]!.split(",").map(Number) as [number, number, number, number];
    else files.push(a);
  }
  fs.mkdirSync(out, { recursive: true });
  for (const file of files) {
    let img = sharp(file);
    if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
    const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const res = analyzeColumn(new Uint8Array(data), info.width, info.height, 3);
    const base = path.basename(file).replace(/\.\w+$/, "");
    const L = res.layout;
    console.log(
      `${base}: ${info.width}x${info.height} → ${L ? `column ${Math.round(L.edges[0]!.x0)}-${Math.round(L.edges[0]!.x1)}, ${L.edges.length} edge rows, pitch ${L.pitch.toFixed(1)}, ${L.lines.length} lines (${L.lines.filter((l) => l.cut).length} cut)` : "no column"} | ${res.ms.ink.toFixed(0)}+${res.ms.segment.toFixed(0)}+${res.ms.crop.toFixed(0)} ms`,
    );
    // overlay: ink map in gray, column edges and line bands
    const w = res.width;
    const h = res.height;
    const rgb = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      const v = 255 - Math.round(res.ink.data[i]! * 255);
      rgb[i * 3] = v;
      rgb[i * 3 + 1] = v;
      rgb[i * 3 + 2] = v;
    }
    const put = (x: number, y: number, r: number, g: number, b: number) => {
      const xi = Math.round(x);
      const yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= w || yi >= h) return;
      const p = (yi * w + xi) * 3;
      rgb[p] = r;
      rgb[p + 1] = g;
      rgb[p + 2] = b;
    };
    if (L) {
      for (let y = 0; y < h; y++) {
        const [e0, e1] = columnEdgesAt(L, y);
        put(e0, y, 0, 120, 255);
        put(e1, y, 0, 120, 255);
      }
      for (const line of L.lines) {
        for (let x = line.x0; x <= line.x1; x++) {
          const yc = lineYAt(line, x);
          put(x, yc, line.cut ? 255 : 230, line.cut ? 0 : 140, 0);
          put(x, yc - L.band / 2, 0, 170, 0);
        }
      }
    }
    await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).png().toFile(path.join(out, `${base}-overlay.png`));
    // stacked crops
    if (res.crops.length > 0) {
      const cw = Math.max(...res.crops.map((c) => c.width));
      const ch = res.crops.reduce((s, c) => s + c.height + 2, 0);
      const buf = Buffer.alloc(cw * ch, 255);
      let y0 = 0;
      for (const c of res.crops) {
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) buf[(y0 + y) * cw + x] = 255 - Math.round(c.data[y * c.width + x]! * 255);
        y0 += c.height + 2;
      }
      await sharp(buf, { raw: { width: cw, height: ch, channels: 1 } }).png().toFile(path.join(out, `${base}-lines.png`));
    }
  }
}

void main();
