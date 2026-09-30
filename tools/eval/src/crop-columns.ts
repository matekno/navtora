/**
 * Crops individual columns out of whole-sheet photos of a sefer (e.g. the
 * British Library set, where each image shows several small columns). Finds the
 * gaps between columns by vertical ink projection and saves each column scaled
 * to 1800 px tall, like a phone photo.
 *
 *   pnpm --filter @navtora/eval crop -- --set bl1462 [--min-gap 40] [--limit 10]
 *
 * Output: tools/eval/data/columns/<set>-cols/<img>-<k>.jpg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const COLUMNS = path.resolve(here, "../data/columns");

function arg(k: string): string | undefined {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

interface Band {
  start: number;
  end: number;
}

/** Column bands along x: inked stretches separated by clear gaps. Works on a downscaled copy. */
async function detectColumns(file: string, minGapPx: number): Promise<{ bands: Band[]; width: number; height: number; scale: number }> {
  const meta = await sharp(file).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const targetW = 1000;
  const scale = width / targetW;
  const small = await sharp(file)
    .resize({ width: targetW })
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = small.info.width;
  const h = small.info.height;
  const px = small.data;
  // skip the top and bottom 15%, which are usually background or wood
  const y0 = Math.floor(h * 0.15);
  const y1 = Math.floor(h * 0.85);
  const profile = new Float64Array(w);
  for (let x = 0; x < w; x++) {
    let ink = 0;
    for (let y = y0; y < y1; y++) if (px[y * w + x]! < 110) ink++;
    profile[x] = ink / (y1 - y0);
  }
  // a text column has a clearly higher fraction of dark pixels than a gap
  const sorted = [...profile].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const threshold = Math.max(0.02, median * 0.5);
  const inkCols = Array.from(profile, (v) => v > threshold);
  const minGap = Math.max(4, Math.round(minGapPx / scale));
  const bands: Band[] = [];
  let start = -1;
  let gap = 0;
  for (let x = 0; x < w; x++) {
    if (inkCols[x]) {
      if (start < 0) start = x;
      gap = 0;
    } else if (start >= 0) {
      gap++;
      if (gap >= minGap) {
        bands.push({ start, end: x - gap });
        start = -1;
        gap = 0;
      }
    }
  }
  if (start >= 0) bands.push({ start, end: w - 1 });
  // drop narrow bands: stains or edges
  const widths = bands.map((b) => b.end - b.start);
  const medW = [...widths].sort((a, b) => a - b)[Math.floor(widths.length / 2)] ?? 0;
  const kept = bands.filter((b) => b.end - b.start >= medW * 0.55);
  return { bands: kept.map((b) => ({ start: Math.round(b.start * scale), end: Math.round(b.end * scale) })), width, height, scale };
}

async function main(): Promise<void> {
  const set = arg("--set") ?? "bl1462";
  const minGap = Number(arg("--min-gap") ?? 40);
  const limit = Number(arg("--limit") ?? Infinity);
  const inDir = path.join(COLUMNS, set);
  const outDir = path.join(COLUMNS, `${set}-cols`);
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs
    .readdirSync(inDir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort()
    .slice(0, limit);
  let total = 0;
  for (const f of files) {
    const file = path.join(inDir, f);
    const { bands, width, height } = await detectColumns(file, minGap);
    const padX = Math.round(width * 0.006);
    let k = 0;
    // right to left, the order columns are read in
    for (const b of [...bands].reverse()) {
      k++;
      const left = Math.max(0, b.start - padX);
      const right = Math.min(width, b.end + padX);
      const out = path.join(outDir, `${f.replace(/\.\w+$/, "")}-${String(k).padStart(2, "0")}.jpg`);
      await sharp(file)
        .extract({ left, top: 0, width: right - left, height })
        .trim({ threshold: 25 })
        .resize({ height: 1800, withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toFile(out);
      total++;
    }
    console.log(`${f}: ${bands.length} columns`);
  }
  console.log(`${total} columns in ${outDir}`);
}

main();
