/**
 * Prueba de autocompletado: ¿el modelo lee la tinta o recita el texto que conoce?
 *
 * Renderiza dos columnas sintéticas con una fuente hebrea del sistema: una con
 * el texto exacto de una columna y otra con palabras cambiadas a propósito por
 * otras palabras reales del vocabulario. Si la transcripción de la versión
 * alterada devuelve las palabras originales, el modelo está completando desde
 * su memoria y el matcher no puede confiar en lecturas "demasiado buenas".
 *
 *   pnpm --filter @kore/eval autocomplete -- [--column 50] [--lines 10] [--swaps 6] [--model ...] [--effort low]
 *
 * Requiere macOS (qlmanage) para rasterizar el SVG.
 */
import "./env";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadDataNode } from "@kore/data";
import { makeRng, tokenizeHebrew } from "@kore/core";
import { ClaudeVisionOcr, parseEffort } from "@kore/ocr";

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

  // palabras reemplazadas por otras formas reales del vocabulario, de longitud parecida, en posiciones fijas
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

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kore-autocomplete-"));
  const exactPng = rasterize(renderSvg(lines), "exact", dir);
  const alteredPng = rasterize(renderSvg(altered.map((w) => w.join(" "))), "altered", dir);
  console.log(`imágenes en ${dir}`);

  const ocr = new ClaudeVisionOcr({
    ...(arg("--model") ? { model: arg("--model")! } : {}),
    effort: parseEffort(arg("--effort"), "low"),
    maxLines: nLines,
  });
  console.log(`modelo ${ocr.model} | esfuerzo ${ocr.effort}\n`);

  for (const [label, png, truth] of [
    ["EXACTA", exactPng, lines],
    ["ALTERADA", alteredPng, altered.map((w) => w.join(" "))],
  ] as const) {
    const { result, meta } = await ocr.recognize({ bytes: png, mime: "image/png" });
    console.log(`--- ${label}: ${meta.ms} ms, tokens ${meta.inputTokens}/${meta.outputTokens}, líneas ${result.lines.length}`);
    let mismatched = 0;
    result.lines.forEach((l, i) => {
      const got = tokenizeHebrew(l.text).join(" ");
      const exp = truth[i] ?? "";
      if (got !== exp) {
        mismatched++;
        console.log(`  línea ${i + 1}\n    esperado: ${exp}\n    leído:    ${got}`);
      }
    });
    console.log(`  líneas distintas de lo impreso: ${mismatched}/${result.lines.length}`);
    if (label === "ALTERADA") {
      let readAsPrinted = 0;
      let autocompleted = 0;
      for (const s of swaps) {
        const got = tokenizeHebrew(result.lines[s.line]?.text ?? "");
        if (got.includes(s.to)) readAsPrinted++;
        else if (got.includes(s.from)) autocompleted++;
      }
      console.log(`\n  cambios: ${swaps.length} | leídos como están impresos: ${readAsPrinted} | autocompletados al original: ${autocompleted} | otros: ${swaps.length - readAsPrinted - autocompleted}`);
      for (const s of swaps) console.log(`    línea ${s.line + 1}: ${s.from} → ${s.to}`);
    }
  }
}

main();
