/**
 * Consistency check for sets without ground truth: a sefer's columns are in
 * order, so the predicted start word must increase from one file to the next.
 * A backward jump flags a doubtful placement.
 *
 *   pnpm --filter @navtora/eval consistency -- --csv data/results/makhonot-claude-opus-5-medium-14.csv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

function main(): void {
  const i = process.argv.indexOf("--csv");
  const rel = i >= 0 ? process.argv[i + 1] : undefined;
  if (!rel) {
    console.error("usage: consistency -- --csv <file.csv>");
    process.exit(1);
  }
  const file = path.isAbsolute(rel) ? rel : path.resolve(here, "..", rel);
  const [header, ...rows] = fs.readFileSync(file, "utf8").trim().split("\n");
  const cols = header!.split(",");
  const idx = (name: string) => cols.indexOf(name);
  const parsed = rows.map((r) => {
    const c = r.split(",");
    return {
      file: c[idx("file")]!,
      status: c[idx("status")]!,
      predCol: c[idx("pred_col")] ?? "",
      start: Number(c[idx("pred_start")]),
      end: Number(c[idx("pred_end")]),
      score: c[idx("score")],
      margin: c[idx("margin")],
      ms: c[idx("ocr_ms")],
    };
  });

  let prev: number | null = null;
  let backwards = 0;
  const counts: Record<string, number> = {};
  console.log("file         status        col      start word    jump   score  margin");
  for (const p of parsed) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
    if (p.status !== "confident" || !Number.isFinite(p.start)) {
      console.log(`${p.file.padEnd(12)} ${p.status.padEnd(12)}    -`);
      continue;
    }
    const jump = prev === null ? "" : String(p.start - prev);
    const flag = prev !== null && p.start < prev ? "  ← backwards" : "";
    if (flag) backwards++;
    console.log(`${p.file.padEnd(12)} ${p.status.padEnd(12)} ${String(p.predCol).padStart(4)}  ${String(p.start).padStart(14)}  ${jump.padStart(6)}  ${String(p.score).padStart(6)}  ${String(p.margin).padStart(6)}${flag}`);
    prev = p.start;
  }
  console.log(`\nstatuses: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" | ")} | backward jumps: ${backwards}`);
}

main();
