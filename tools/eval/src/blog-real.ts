/**
 * Runs the local reader on photos of real sifrei and draws what it found over
 * each one, for the blog post on how the network was trained and tested: the
 * column it found and every word it read, colored by how it compares to the
 * Torah's text where the matcher placed the photo.
 *
 *   pnpm --filter @navtora/eval real -- <id>=<image> ... [photo:<id>=<image> ...] [--out-public dir] [--out-data file]
 *
 * Each image is scaled to 1800 px on the long edge first, like the eval's
 * columns. Writes <id>.webp (the photo) and <id>-analysis.webp (with the
 * drawing) to apps/web/public/blog/training/real/, and what was found to
 * apps/web/lib/blog/real-sifrei.json. A photo: entry is only resized, for a
 * picture shown as is (a whole sheet with several columns).
 *
 * The post's photos are listed, with their sources and licenses, in
 * apps/web/public/blog/training/real/CREDITS.md. The Commons pages come as
 * 1920 px thumbnails (see `download --pages`), and the British Library sheet's
 * columns were cut with `crop`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadDataNode } from "@navtora/data";
import { createLocator, tokensFromOcr } from "@navtora/core";
import { columnEdgesAt, LINE_HEIGHT, lineYAt, type TextLine } from "@navtora/vision";
import { readColumnLocally, type LineLogits } from "@navtora/ocr";
import { alignPairs, ctcSteps, r1, wordSteps, type PairKind } from "./blog-shared";
import { createRecognizer } from "./local-provider";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");

/** the blog's theme colors, as in apps/web/app/globals.css */
const COLOR: Record<PairKind, string> = { same: "#4cd18a", confusable: "#f5c451", wildcard: "#f5c451", different: "#ff6b6b", extra: "#a5a9b8" };
const ACCENT = "#f5c451";
const LONG_EDGE = 1800;
/** size of the images written, in pixels */
const OUT_MAX = { width: 560, height: 1100 };

const pts = (p: Array<[number, number]>) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** Points along a line between x0 and x1, shifted by `offset` from its center. */
function along(line: TextLine, x0: number, x1: number, offset: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let x = x0; x < x1; x += 6) out.push([x, lineYAt(line, x) + offset]);
  out.push([x1, lineYAt(line, x1) + offset]);
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let outPublic = path.join(REPO, "apps/web/public/blog/training/real");
  let outData = path.join(REPO, "apps/web/lib/blog/real-sifrei.json");
  const inputs: Array<{ id: string; file: string }> = [];
  const photos: Array<{ id: string; file: string }> = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--out-public") outPublic = path.resolve(argv[++i]!);
    else if (a === "--out-data") outData = path.resolve(argv[++i]!);
    else if (a.includes("=")) {
      const [id, file] = a.replace(/^photo:/, "").split("=") as [string, string];
      (a.startsWith("photo:") ? photos : inputs).push({ id, file: path.resolve(file) });
    }
  }
  if (inputs.length === 0) throw new Error("Usage: real <id>=<image> ...");
  fs.mkdirSync(outPublic, { recursive: true });

  const data = loadDataNode();
  const locator = createLocator(data, { debug: true });
  const recognize = await createRecognizer();
  const results: Record<string, unknown> = {};
  for (const { id, file } of photos) {
    const out = await sharp(file).removeAlpha().resize({ width: 1400, height: 1400, fit: "inside" }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
    await sharp(out.data).toFile(path.join(outPublic, `${id}.webp`));
    results[id] = { width: out.info.width, height: out.info.height };
  }

  for (const { id, file } of inputs) {
    const photo = await sharp(file).removeAlpha().resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside" }).toBuffer();
    const { data: pixels, info } = await sharp(photo).raw().toBuffer({ resolveWithObject: true });
    let logits: LineLogits[] = [];
    const read = await readColumnLocally(new Uint8Array(pixels), info.width, info.height, info.channels as 3, async (crops) => (logits = await recognize(crops)));
    const { analysis } = read;
    const L = analysis.layout;
    const res = locator.locate(read.result);
    const best = res.best;
    const top = res.debug?.candidates[0];
    const tokens = tokensFromOcr(read.result);
    const alignment = top ? alignPairs(tokens, locator.text.words.slice(top.startWord, top.endWord + 1), top.startWord) : [];
    const kindOf = new Map(alignment.map((a) => [a.k, a.kind]));
    console.log(`${id}: ${read.result.lines.length} lines read; ${res.status}${best ? `, ${best.parashot[0]?.name.en} ${JSON.stringify(best.verses)}` : ""}`);

    // the drawing, in the reader's working pixels
    const W = analysis.width;
    const H = analysis.height;
    const shapes: string[] = [];
    if (L) {
      const ys = [0, ...L.edges.map((e) => e.y), H];
      const outline = [...ys.map((y) => [columnEdgesAt(L, y)[0], y] as [number, number]), ...ys.map((y) => [columnEdgesAt(L, y)[1], y] as [number, number]).reverse()];
      shapes.push(`<path d="M0,0 H${W} V${H} H0 Z M${pts(outline).replace(/ /g, " L")} Z" fill="rgb(11,12,16)" fill-opacity="0.55" fill-rule="evenodd"/>`);
      shapes.push(`<polygon points="${pts(outline)}" fill="none" stroke="${ACCENT}" stroke-width="${r1(W / 300)}" stroke-linejoin="round"/>`);
      const scale = L.band / LINE_HEIGHT;
      const half = L.band * 0.4;
      // words of the lines sent to the matcher, numbered in reading order as tokensFromOcr numbers them
      let k = 0;
      L.lines.forEach((line, li) => {
        const text = read.decoded[li]?.text ?? "";
        const sent = text.replace(/[ ?]/g, "").length > 0;
        const spans = wordSteps(ctcSteps(logits[li])).map(([a, b]) => [a * 4, (b + 1) * 4] as const);
        const cuts = [0, ...spans.slice(1).map(([a], i) => (spans[i]![1] + a) / 2), Math.round((line.x1 - line.x0) / scale)];
        spans.forEach((_, j) => {
          const kind = sent ? (kindOf.get(k++) ?? null) : null;
          const x0 = line.x1 - cuts[j + 1]! * scale + 1.5;
          const x1 = Math.max(x0 + 2, line.x1 - cuts[j]! * scale - 1.5);
          const box = [...along(line, x0, x1, -half), ...along(line, x0, x1, half).reverse()];
          shapes.push(
            kind
              ? `<polygon points="${pts(box)}" fill="${COLOR[kind]}" fill-opacity="0.4" stroke="${COLOR[kind]}" stroke-width="${r1(W / 600)}"/>`
              : `<polygon points="${pts(box)}" fill="none" stroke="#f2f2ef" stroke-opacity="0.5" stroke-width="${r1(W / 900)}" stroke-dasharray="4 4"/>`,
          );
        });
      });
      if (k !== tokens.length) throw new Error(`${id}: placed ${k} words for ${tokens.length} tokens`);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${shapes.join("")}</svg>`;
    const base = sharp(photo).resize(W, H);
    const plain = await base.clone().resize({ ...OUT_MAX, fit: "inside" }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    await sharp(plain.data).toFile(path.join(outPublic, `${id}.webp`));
    const drawn = await base.clone().composite([{ input: Buffer.from(svg) }]).toBuffer();
    await sharp(drawn).resize({ ...OUT_MAX, fit: "inside" }).webp({ quality: 80 }).toFile(path.join(outPublic, `${id}-analysis.webp`));

    results[id] = {
      width: plain.info.width,
      height: plain.info.height,
      status: res.status,
      linesRead: read.result.lines.length,
      parasha: best?.parashot[0]?.name ?? null,
      book: best?.book.name ?? null,
      /** the standard-layout column; only meaningful for a sefer that follows that layout */
      column: best?.standardColumn?.column ?? null,
      verses: best?.verses ?? null,
      alignedWords: best?.confidence.alignedTokens ?? 0,
      linesCovered: best?.confidence.linesCovered ?? 0,
      words: alignment.length,
      same: alignment.filter((a) => a.kind === "same").length,
    };
  }
  fs.writeFileSync(outData, JSON.stringify(results, null, 1) + "\n");
  console.log(`→ ${path.relative(REPO, outPublic)}/ and ${path.relative(REPO, outData)}`);
}

void main();
