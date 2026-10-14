/**
 * Runs the whole reader on one real photo and writes what each step produced,
 * for the illustrations of the "how it works" blog post: the photo, its ink
 * map, the column profile and edges, the line paths, the line crops, what the
 * network read, the votes across the Torah and the final alignment.
 *
 *   pnpm --filter @navtora/eval figures -- <photo> [--target book:chapter:verse] [--out-public dir] [--out-data file]
 *
 * Nothing in the post is drawn by hand: every overlay comes from this output.
 * The post's photo is the frame at 5.2 s of apps/web/public/demo/masei-to-devarim.mp4,
 * cropped to the camera view with the app's guide painted out; the script saves
 * it as photo.webp next to the other images. --target is where to navigate to
 * (Devarim 1:1 by default).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadDataNode } from "@navtora/data";
import { createLocator, DEFAULT_MATCH_OPTIONS, isConfusable, navigate, targetFromVerse, tokensFromOcr, wordSimilarity, type Token } from "@navtora/core";
import { columnEdgesAt, LINE_HEIGHT, smooth1d, type Plane } from "@navtora/vision";
import { LOCAL_ALPHABET, readColumnLocally, type LineLogits } from "@navtora/ocr";
import { createRecognizer } from "./local-provider";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");

/** decimals kept in the JSON */
const r1 = (v: number) => Math.round(v * 10) / 10;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

function inkImage(ink: Plane): Buffer {
  const out = Buffer.alloc(ink.width * ink.height);
  for (let i = 0; i < out.length; i++) out[i] = 255 - Math.round(ink.data[i]! * 255);
  return out;
}

/** Ink summed down each x of the photo, normalized to [0, 1] and reduced to `n` samples. */
function columnProfile(ink: Plane, n: number): number[] {
  const prof = new Float32Array(ink.width);
  for (let y = 0; y < ink.height; y++) for (let x = 0; x < ink.width; x++) prof[x] = prof[x]! + ink.data[y * ink.width + x]!;
  const sm = smooth1d(prof, Math.max(0.7, ink.width / 400));
  const max = Math.max(...sm);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(r3(sm[Math.min(ink.width - 1, Math.round(((i + 0.5) * ink.width) / n))]! / max));
  return out;
}

/** Ink summed along each row of a vertical strip of the column, normalized. */
function stripRowProfile(ink: Plane, x0: number, x1: number): number[] {
  const out = new Float32Array(ink.height);
  for (let y = 0; y < ink.height; y++) {
    let s = 0;
    for (let x = Math.round(x0); x < Math.round(x1); x++) s += ink.data[y * ink.width + x]!;
    out[y] = s;
  }
  const sm = smooth1d(out, 1.5);
  const max = Math.max(...sm);
  return Array.from(sm, (v) => r3(v / max));
}

/** Per time step of a line, the letter the network liked best ("" for the CTC blank) and its probability. */
function ctcSteps(l: LineLogits | undefined): Array<{ c: string; p: number }> {
  if (!l) return [];
  const out: Array<{ c: string; p: number }> = [];
  for (let t = 0; t < l.steps; t++) {
    let best = 0;
    let bestV = -Infinity;
    for (let c = 0; c < l.classes; c++) {
      const v = l.data[t * l.classes + c]!;
      if (v > bestV) {
        bestV = v;
        best = c;
      }
    }
    out.push({ c: best === 0 ? "" : (LOCAL_ALPHABET[best - 1] ?? ""), p: r3(Math.exp(bestV)) });
  }
  return out;
}

/**
 * Where each word of a decoded line sits: the time steps of its first and last
 * letter. Words are split where the network output a space, as in ctcDecode.
 */
function wordSteps(steps: Array<{ c: string }>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let open: [number, number] | null = null;
  for (let t = 0; t < steps.length; t++) {
    const c = steps[t]!.c;
    if (c === " ") {
      if (open) out.push(open);
      open = null;
    } else if (c !== "") {
      if (open) open[1] = t;
      else open = [t, t];
    }
  }
  if (open) out.push(open);
  return out;
}

type PairKind = "same" | "confusable" | "wildcard" | "different" | "extra";

/** Kind of difference between a word as read and the word in the scroll. */
function pairKind(read: string, word: string): PairKind {
  if (read === word) return "same";
  if (read.length !== word.length) return "different";
  let wildcard = false;
  for (let i = 0; i < read.length; i++) {
    if (read[i] === word[i]) continue;
    if (read[i] === "?") wildcard = true;
    else if (!isConfusable(read[i]!, word[i]!)) return "different";
  }
  return wildcard ? "wildcard" : "confusable";
}

/**
 * The matcher's local alignment (same scores as alignWindow), keeping which
 * word each token was paired with, for the figure that compares them.
 */
function alignPairs(tokens: Token[], span: readonly string[], start: number): Array<{ k: number; line: number; read: string; word: string | null; position: number | null; kind: PairKind }> {
  const m = tokens.length;
  const n = span.length;
  const minSim = DEFAULT_MATCH_OPTIONS.minPairSimilarity;
  const sim = (i: number, j: number) => (tokens[i]!.text === span[j] ? 1 : wordSimilarity(tokens[i]!.text, span[j]!, 1 - minSim));
  const H = new Float64Array((m + 1) * (n + 1));
  const T = new Uint8Array((m + 1) * (n + 1));
  const at = (i: number, j: number) => i * (n + 1) + j;
  let best = 0;
  let bi = 0;
  let bj = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = sim(i - 1, j - 1);
      const pair = s >= minSim ? s * 2 - 1 + (tokens[i - 1]!.text.length >= 4 ? 0.3 : 0) : -1;
      const opts = [0, H[at(i - 1, j - 1)]! + pair, H[at(i - 1, j)]! - 0.6, H[at(i, j - 1)]! - 0.6];
      let t = 0;
      for (let k = 1; k < 4; k++) if (opts[k]! > opts[t]!) t = k;
      H[at(i, j)] = opts[t]!;
      T[at(i, j)] = t;
      if (opts[t]! > best) {
        best = opts[t]!;
        bi = i;
        bj = j;
      }
    }
  }
  const out: Array<{ k: number; line: number; read: string; word: string | null; position: number | null; kind: PairKind }> = [];
  let i = bi;
  let j = bj;
  while (i > 0 && j > 0 && T[at(i, j)] !== 0) {
    const t = T[at(i, j)]!;
    if (t === 1) {
      const tok = tokens[i - 1]!;
      const ok = sim(i - 1, j - 1) >= minSim;
      out.push({ k: tok.k, line: tok.line, read: tok.text, word: ok ? span[j - 1]! : null, position: ok ? start + j - 1 : null, kind: ok ? pairKind(tok.text, span[j - 1]!) : "extra" });
      i--;
      j--;
    } else if (t === 2) {
      out.push({ k: tokens[i - 1]!.k, line: tokens[i - 1]!.line, read: tokens[i - 1]!.text, word: null, position: null, kind: "extra" });
      i--;
    } else j--;
  }
  return out.reverse();
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let photo = "";
  let target = "5:1:1";
  let outPublic = path.join(REPO, "apps/web/public/blog/how-it-works");
  let outData = path.join(REPO, "apps/web/lib/blog/how-it-works-figures.json");
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--target") target = argv[++i]!;
    else if (a === "--out-public") outPublic = path.resolve(argv[++i]!);
    else if (a === "--out-data") outData = path.resolve(argv[++i]!);
    else photo = path.resolve(a);
  }
  if (!photo) throw new Error("Usage: figures <photo> [--target book:chapter:verse]");
  fs.mkdirSync(outPublic, { recursive: true });
  fs.mkdirSync(path.dirname(outData), { recursive: true });

  const data = loadDataNode();
  const locator = createLocator(data, { debug: true });
  const recognize = await createRecognizer();
  // keep the raw network output for the CTC figure
  let logits: LineLogits[] = [];
  const bytes = fs.readFileSync(photo);
  const { data: pixels, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const read = await readColumnLocally(new Uint8Array(pixels), info.width, info.height, 3, async (crops) => (logits = await recognize(crops)));
  const { analysis } = read;
  const L = analysis.layout;
  if (!L) throw new Error("No column found in the photo.");
  const res = locator.locate(read.result);
  const best = res.best;
  console.log(`${read.result.lines.length} lines read; ${res.status}${best ? `, column ${best.standardColumn?.column}, ${best.parashot[0]?.name.en}` : ""}`);
  read.decoded.forEach((d, i) => console.log(String(i).padStart(2), d.confidence.toFixed(2), d.text));

  // images: the photo at working size, its ink map, and the line crops stacked
  const W = analysis.width;
  const H = analysis.height;
  await sharp(bytes).resize(W, H).webp({ quality: 88 }).toFile(path.join(outPublic, "photo.webp"));
  await sharp(inkImage(analysis.ink), { raw: { width: W, height: H, channels: 1 } }).webp({ quality: 88 }).toFile(path.join(outPublic, "ink.webp"));
  const crops = analysis.crops;
  const cw = Math.max(...crops.map((c) => c.width));
  const stack = Buffer.alloc(cw * crops.length * LINE_HEIGHT, 255);
  crops.forEach((c, k) => {
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) stack[(k * LINE_HEIGHT + y) * cw + x] = 255 - Math.round(c.data[y * c.width + x]! * 255);
  });
  await sharp(stack, { raw: { width: cw, height: crops.length * LINE_HEIGHT, channels: 1 } }).webp({ quality: 90 }).toFile(path.join(outPublic, "lines.webp"));

  // column: where the edges were measured, and the strips used to follow the lines
  const [m0, m1] = columnEdgesAt(L, H / 2);
  const strips = Math.max(3, Math.min(12, Math.round((m1 - m0) / (L.pitch * 6))));
  const stripX = Array.from({ length: strips + 1 }, (_, k) => r1(m0 + (k / strips) * (m1 - m0)));
  // two strips near the column's sides, to show that their peaks don't line up
  const sideStrips = [0, strips - 1].map((k) => ({ x0: stripX[k]!, x1: stripX[k + 1]!, profile: stripRowProfile(analysis.ink, stripX[k]!, stripX[k + 1]!) }));

  // matcher: tokens, the votes over the whole Torah, the alignment of the winning span
  const tokens = tokensFromOcr(read.result);
  const words = locator.text.words;
  // every vote, with the same weights and bins as voteOrigins; each bar shows its strongest bin
  const BUCKETS = 240;
  const { binWidth, maxPositionsForFuzzy } = DEFAULT_MATCH_OPTIONS;
  const fine = new Map<number, number>();
  const add = (bin: number, w: number) => fine.set(bin, (fine.get(bin) ?? 0) + w);
  for (const tok of tokens) {
    for (const c of locator.index.candidates(tok.text)) {
      if (c.similarity < 1 && c.positions.length > maxPositionsForFuzzy) continue;
      const w = c.idf * (c.similarity === 1 ? 1 : c.similarity * 0.8);
      for (const p of c.positions) {
        const bin = Math.floor((p - tok.k) / binWidth);
        add(bin, w);
        add(bin - 1, w * 0.5);
        add(bin + 1, w * 0.5);
      }
    }
  }
  const votes = new Array<number>(BUCKETS).fill(0);
  for (const [bin, score] of fine) {
    const b = Math.max(0, Math.min(BUCKETS - 1, Math.floor(((bin * binWidth) / words.length) * BUCKETS)));
    votes[b] = Math.max(votes[b]!, score);
  }
  const vmax = Math.max(...votes);
  const cand = res.debug?.candidates ?? [];
  const top = cand[0];
  const alignment = top ? alignPairs(tokens, words.slice(top.startWord, top.endWord + 1), top.startWord) : [];

  // a vote to explain: the rarest word read right, where it is in the Torah and the start it votes for
  const count = (form: string) => locator.index.positionsOf(form).length;
  const rare = alignment.filter((a) => a.kind === "same" && a.read.length >= 4).sort((a, b) => count(a.read) - count(b.read) || a.k - b.k)[0];
  const rarePos = rare && top ? locator.index.positionsOf(rare.read).find((p) => p >= top.startWord && p <= top.endWord) : undefined;
  const voteExample = rare && rarePos !== undefined ? { word: rare.read, k: rare.k, position: rarePos, origin: rarePos - rare.k, count: count(rare.read), common: "את", commonCount: count("את") } : null;

  // navigation to the target
  const [book, chapter, verse] = target.split(":").map(Number) as [number, number, number];
  const tgt = targetFromVerse(locator.text, { book, chapter, verse }, target);
  const nav = best && tgt ? navigate(best, tgt, { text: locator.text, layout: data.layout }, top?.lineStarts) : null;
  const targetColumn = tgt ? data.layout.columns.find((c) => tgt.word >= c.startWord && tgt.word <= c.endWord)?.n ?? null : null;

  const lineOrder = new Map<number, number>();
  read.decoded.forEach((d, k) => {
    if (d.text.replace(/[ ?]/g, "").length > 0) lineOrder.set(k, lineOrder.size);
  });
  const ctcLine = Math.min(4, crops.length - 1);
  // the first two words of that line as read, and the scroll's words there
  const ctcOcrLine = lineOrder.get(ctcLine);
  const ctcRead = (read.decoded[ctcLine]?.text ?? "").split(" ").slice(0, 2);
  const firstPaired = alignment.findIndex((a) => a.line === ctcOcrLine && a.position !== null);
  const lineStart = alignment.findIndex((a) => a.line === ctcOcrLine);
  // the line's first word sits as many words before its first paired word as it is tokens before it
  const ctcFrom = firstPaired >= 0 ? alignment[firstPaired]!.position! - (firstPaired - lineStart) : -1;
  const ctcTruth = ctcFrom >= 0 ? words.slice(ctcFrom, ctcFrom + 2) : [];

  // each word's letters as time steps of its line, to place the word on the photo
  const lineWordSteps = crops.map((_, k) => wordSteps(ctcSteps(logits[k])));
  lineWordSteps.forEach((ws, k) => {
    const n = (read.decoded[k]?.text ?? "").split(" ").filter(Boolean).length;
    if (ws.length !== n) throw new Error(`line ${k}: ${ws.length} word spans for ${n} words`);
  });

  const figures = {
    source: path.basename(photo),
    width: W,
    height: H,
    pitch: r1(L.pitch),
    band: r1(L.band),
    profile: columnProfile(analysis.ink, 160),
    edges: L.edges.map((e) => ({ y: r1(e.y), x0: r1(e.x0), x1: r1(e.x1) })),
    strips: { x: stripX, side: sideStrips },
    lines: L.lines.map((l, k) => ({
      xs: l.xs.map(r1),
      ys: l.ys.map(r1),
      x0: r1(l.x0),
      x1: r1(l.x1),
      cut: l.cut,
      crop: { width: crops[k]!.width, top: k * LINE_HEIGHT },
      text: read.decoded[k]?.text ?? "",
      words: lineWordSteps[k]!,
      confidence: r3(read.decoded[k]?.confidence ?? 0),
      ocrLine: lineOrder.get(k) ?? null,
    })),
    cropHeight: LINE_HEIGHT,
    cropWidth: cw,
    ctc: { line: ctcLine, steps: ctcSteps(logits[ctcLine]), read: ctcRead, truth: ctcTruth },
    tokens: tokens.length,
    votes: votes.map((v) => r3(v / vmax)),
    torahWords: words.length,
    books: [1, 2, 3, 4, 5].map((b) => locator.text.startOfVerse({ book: b, chapter: 1, verse: 1 })),
    alignment,
    voteExample,
    result: best
      ? {
          status: res.status,
          column: best.standardColumn?.column ?? null,
          book: best.book.name,
          parasha: best.parashot[0]?.name ?? null,
          verses: best.verses,
          span: best.span,
          score: r1(best.confidence.score),
          second: cand[1] ? r1(cand[1].score) : null,
          margin: r3(best.confidence.margin),
          alignedTokens: best.confidence.alignedTokens,
          linesCovered: best.confidence.linesCovered,
        }
      : null,
    navigation: nav && tgt ? { target: { book, chapter, verse }, targetColumn, direction: nav.direction, columns: nav.columns, exact: nav.columnsExact } : null,
    ms: { ...analysis.ms, ...read.ms },
  };
  fs.writeFileSync(outData, JSON.stringify(figures) + "\n");
  console.log(`→ ${path.relative(REPO, outPublic)}/ and ${path.relative(REPO, outData)}`);
  console.log(JSON.stringify({ result: figures.result, navigation: figures.navigation, ms: figures.ms }, null, 1));
}

void main();
