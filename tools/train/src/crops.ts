/**
 * Cuts line crops from synthetic column photos with the same code the app
 * runs (@navtora/vision), and labels each crop with the text of the line it
 * covers. Crops whose line cannot be matched unambiguously are skipped, so the
 * labels stay clean; the counts double as a measure of segmentation quality.
 *
 *   pnpm --filter @navtora/train crops -- --in data/synth/train --out data/crops/train [--shard 0/4]
 *
 * Writes <out>/<sample>_<line>.png (white = ink) and appends to <out>/labels-<shard>.tsv.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { analyzeColumn, lineYAt } from "@navtora/vision";

interface Meta {
  lines: Array<{ index: number; text: string; points: Array<[number, number]> }>;
}

function yAt(points: Array<[number, number]>, x: number): number {
  let i = 0;
  while (i < points.length - 2 && x > points[i + 1]![0]) i++;
  const [x0, y0] = points[i]!;
  const [x1, y1] = points[i + 1]!;
  return y0 + ((x - x0) / (x1 - x0 || 1)) * (y1 - y0);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const input = get("--in");
  const out = get("--out");
  if (!input || !out) throw new Error("usage: --in <dir> --out <dir> [--shard i/n]");
  const [shard, shards] = (get("--shard") ?? "0/1").split("/").map(Number) as [number, number];
  fs.mkdirSync(out, { recursive: true });
  const ids = fs
    .readdirSync(input)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort()
    .filter((_, i) => i % shards === shard);

  const labels: string[] = [];
  const stats = { images: 0, noColumn: 0, truth: 0, detected: 0, cut: 0, unmatched: 0, badExtent: 0, kept: 0 };
  for (const id of ids) {
    const meta = JSON.parse(fs.readFileSync(path.join(input, `${id}.json`), "utf8")) as Meta;
    const { data, info } = await sharp(path.join(input, `${id}.jpg`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const res = analyzeColumn(new Uint8Array(data), info.width, info.height, 3);
    stats.images++;
    stats.truth += meta.lines.filter((l) => l.text.length > 0).length;
    const L = res.layout;
    if (!L) {
      stats.noColumn++;
      continue;
    }
    // truth points are in original pixels; the layout is in working pixels
    const s = res.scale;
    const used = new Set<number>();
    const writes: Array<Promise<unknown>> = [];
    L.lines.forEach((line, li) => {
      stats.detected++;
      if (line.cut) {
        stats.cut++;
        return;
      }
      const xm = (line.x0 + line.x1) / 2;
      const yd = lineYAt(line, xm);
      let best = -1;
      let bestD = Infinity;
      meta.lines.forEach((t, ti) => {
        const d = Math.abs(yAt(t.points, xm / s) * s - yd);
        if (d < bestD) {
          bestD = d;
          best = ti;
        }
      });
      const truth = meta.lines[best];
      if (!truth || truth.text.length === 0 || bestD > 0.3 * L.pitch || used.has(best)) {
        stats.unmatched++;
        return;
      }
      // the crop must cover the line and not much more (e.g. a neighbor column)
      const tx0 = Math.min(...truth.points.map((p) => p[0])) * s;
      const tx1 = Math.max(...truth.points.map((p) => p[0])) * s;
      const tw = tx1 - tx0;
      // lines start at the right edge of the column; short lines end early on the left
      if (line.x1 < tx1 - 0.08 * tw || line.x0 < tx0 - 0.1 * tw || line.x1 > tx1 + 0.1 * tw) {
        stats.badExtent++;
        return;
      }
      used.add(best);
      const crop = res.crops[li]!;
      const buf = Buffer.alloc(crop.width * crop.height);
      for (let i = 0; i < buf.length; i++) buf[i] = Math.round(crop.data[i]! * 255);
      const file = `${id}_${String(li).padStart(2, "0")}.png`;
      writes.push(sharp(buf, { raw: { width: crop.width, height: crop.height, channels: 1 } }).png().toFile(path.join(out, file)));
      labels.push(`${file}\t${truth.text}`);
      stats.kept++;
    });
    await Promise.all(writes);
  }
  fs.writeFileSync(path.join(out, `labels-${shard}.tsv`), labels.join("\n") + "\n");
  console.log(JSON.stringify(stats));
}

void main();
