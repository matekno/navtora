/**
 * Autocomplete test: does the model read the ink or recite the text it knows?
 *
 * Renders two synthetic columns in a system Hebrew font: one with a column's
 * exact text, one with some words swapped for other real vocabulary words. If
 * the altered version transcribes back to the original words, the model is
 * filling in from memory and "too good" readings cannot be trusted.
 *
 *   pnpm --filter @navtora/eval autocomplete -- [--column 50] [--lines 10] [--swaps 6] [--model ...] [--effort low]
 *
 * Requires macOS (qlmanage) to rasterize the SVG.
 */
import "./env";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadDataNode } from "@navtora/data";
import { makeRng, tokenizeHebrew } from "@navtora/core";
import { ClaudeVisionOcr, parseEffort } from "@navtora/ocr";

function arg(k: string): string | undefined {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function renderSvg(lines: string[]): string {
  const width = 900;
  const lineHeight = 46;
  const height = lines.length * lineHeight + 80;
  const body = lines
    .map(
      (l, i) =>
        `<text x="${width - 40}" y="${60 + i * lineHeight}" text-anchor="end" font-family="Raanana, Arial Hebrew, New Peninim MT, serif" font-size="30" fill="#1a1208" xml:space="preserve">${l}</text>`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#e9dcc3"/>
${body}
</svg>`;
}

function rasterize(svg: string, name: string, dir: string): Uint8Array {
  const svgPath = path.join(dir, `${name}.svg`);
  fs.writeFileSync(svgPath, svg);
  execFileSync("qlmanage", ["-t", "-s", "1800", "-o", dir, svgPath], { stdio: "ignore" });
  const png = path.join(dir, `${name}.svg.png`);
  return new Uint8Array(fs.readFileSync(png));
}

async function main(): Promise<void> {
  const data = loadDataNode();
  const column = Number(arg("--column") ?? 50);
  const nLines = Number(arg("--lines") ?? 10);
  const nSwaps = Number(arg("--swaps") ?? 6);
  const col = data.layout.columns[column - 1]!;
  const lines = col.lines.slice(0, nLines).map((l) => tokenizeHebrew(l.text).join(" "));

  // swap words for other real vocabulary forms of similar length, deterministically
  const rng = makeRng(column * 31 + nSwaps);
  const vocab = [...new Set(data.torah.words)].filter((w) => w.length >= 3 && w.length <= 6);
  const altered = lines.map((l) => l.split(" "));
  const swaps: Array<{ line: number; from: string; to: string }> = [];
  let attempts = 0;
  while (swaps.length < nSwaps && attempts++ < 200) {
    const li = Math.floor(rng() * altered.length);
    const words = altered[li]!;
    const wi = Math.floor(rng() * words.length);
    const from = words[wi]!;
    if (from.length < 3 || swaps.some((s) => s.line === li)) continue;
    const to = vocab[Math.floor(rng() * vocab.length)]!;
    if (to === from) continue;
    words[wi] = to;
    swaps.push({ line: li, from, to });
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "navtora-autocomplete-"));
  const exactPng = rasterize(renderSvg(lines), "exact", dir);
  const alteredPng = rasterize(renderSvg(altered.map((w) => w.join(" "))), "altered", dir);
  console.log(`images in ${dir}`);

  const ocr = new ClaudeVisionOcr({
    ...(arg("--model") ? { model: arg("--model")! } : {}),
    effort: parseEffort(arg("--effort"), "low"),
    maxLines: nLines,
  });
  console.log(`model ${ocr.model} | effort ${ocr.effort}\n`);

  for (const [label, png, truth] of [
    ["EXACT", exactPng, lines],
    ["ALTERED", alteredPng, altered.map((w) => w.join(" "))],
  ] as const) {
    const { result, meta } = await ocr.recognize({ bytes: png, mime: "image/png" });
    console.log(`--- ${label}: ${meta.ms} ms, tokens ${meta.inputTokens}/${meta.outputTokens}, lines ${result.lines.length}`);
    let mismatched = 0;
    result.lines.forEach((l, i) => {
      const got = tokenizeHebrew(l.text).join(" ");
      const exp = truth[i] ?? "";
      if (got !== exp) {
        mismatched++;
        console.log(`  line ${i + 1}\n    expected: ${exp}\n    read:     ${got}`);
      }
    });
    console.log(`  lines differing from the rendered text: ${mismatched}/${result.lines.length}`);
    if (label === "ALTERED") {
      let readAsPrinted = 0;
      let autocompleted = 0;
      for (const s of swaps) {
        const got = tokenizeHebrew(result.lines[s.line]?.text ?? "");
        if (got.includes(s.to)) readAsPrinted++;
        else if (got.includes(s.from)) autocompleted++;
      }
      console.log(`\n  swaps: ${swaps.length} | read as rendered: ${readAsPrinted} | autocompleted to original: ${autocompleted} | other: ${swaps.length - readAsPrinted - autocompleted}`);
      for (const s of swaps) console.log(`    line ${s.line + 1}: ${s.from} → ${s.to}`);
    }
  }
}

main();
