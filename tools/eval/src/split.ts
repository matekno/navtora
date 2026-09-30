/**
 * Converts the downloaded PDFs and ZIPs into one JPEG per column:
 * tools/eval/data/columns/<set>/<nnn>.jpg
 *
 *   pnpm --filter @navtora/eval split -- [shannon|kokhav|makhonot|bl1462|all] [--scale 1800]
 *
 * Uses pdftoppm (poppler), scaling each page so its long side is --scale pixels,
 * as the app does with phone photos. The British Library ZIP is unpacked as is.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SCANS = path.resolve(here, "../data/scans");
export const COLUMNS = path.resolve(here, "../data/columns");

function pdfToJpegs(pdf: string, outDir: string, prefix: string, scaleTo: number, offset: number): number {
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = path.join(outDir, `_tmp_${prefix}`);
  execFileSync("pdftoppm", ["-scale-to", String(scaleTo), "-jpeg", "-jpegopt", "quality=88", pdf, tmp], { stdio: "inherit" });
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith(`_tmp_${prefix}-`) && f.endsWith(".jpg"))
    .sort((a, b) => Number(a.match(/-(\d+)\.jpg$/)?.[1]) - Number(b.match(/-(\d+)\.jpg$/)?.[1]));
  files.forEach((f, i) => {
    const n = offset + i + 1;
    fs.renameSync(path.join(outDir, f), path.join(outDir, `${String(n).padStart(3, "0")}.jpg`));
  });
  return files.length;
}

function splitSet(set: string, scaleTo: number): void {
  const outDir = path.join(COLUMNS, set);
  if (fs.existsSync(outDir) && fs.readdirSync(outDir).some((f) => f.endsWith(".jpg"))) {
    console.log(`✓ ${set}: columns already in ${outDir}`);
    return;
  }
  const srcDir = path.join(SCANS, set);
  if (!fs.existsSync(srcDir)) {
    console.error(`✗ ${set}: not downloaded. Run download first.`);
    return;
  }
  const files = fs.readdirSync(srcDir).sort();
  let count = 0;
  for (const f of files) {
    const full = path.join(srcDir, f);
    if (f.endsWith(".pdf")) {
      count += pdfToJpegs(full, outDir, f.replace(/\W/g, ""), scaleTo, count);
    } else if (f.endsWith(".zip")) {
      fs.mkdirSync(outDir, { recursive: true });
      execFileSync("unzip", ["-oq", full, "-d", path.join(outDir, "_zip")], { stdio: "inherit" });
      const imgs: string[] = [];
      const walk = (d: string) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else if (/\.(jpe?g|png|tiff?)$/i.test(e.name) && !e.name.startsWith(".")) imgs.push(p);
        }
      };
      walk(path.join(outDir, "_zip"));
      imgs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      imgs.forEach((p, i) => {
        const ext = path.extname(p).toLowerCase() === ".png" ? ".png" : ".jpg";
        fs.copyFileSync(p, path.join(outDir, `${String(count + i + 1).padStart(3, "0")}${ext}`));
      });
      count += imgs.length;
      fs.rmSync(path.join(outDir, "_zip"), { recursive: true, force: true });
    }
  }
  console.log(`✓ ${set}: ${count} images in ${outDir}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const scaleIdx = args.indexOf("--scale");
  const scaleTo = scaleIdx >= 0 ? Number(args[scaleIdx + 1]) : 1800;
  const sets = args.filter((a) => !a.startsWith("--") && a !== String(scaleTo));
  const wanted = sets.length === 0 || sets.includes("all") ? ["shannon", "kokhav", "makhonot", "bl1462"] : sets;
  for (const s of wanted) splitSet(s, scaleTo);
}

main();
