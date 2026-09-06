/**
 * Corre el pipeline completo (OCR + matcher) sobre las columnas de un set y
 * compara con la verdad conocida.
 *
 *   pnpm --filter @kore/eval pipeline -- --set shannon [--provider claude|oracle] [--limit 20] [--start 1] [--cer 0.2]
 *                                          [--model claude-opus-5] [--effort low|medium|high] [--max-lines 14]
 *
 * Verdad por set: tools/eval/truth/<set>.json con { "offset": n } o con
 * { "segments": [{ "from", "to", "offset" }] } cuando el archivo k corresponde a
 * la columna estándar k - offset (shannon), o con
 * { "columns": { "007": { "startWord": 1234, "endWord": 1600 } } } cuando el
 * layout no es el estándar (kokhav, makhonot, bl1462).
 *
 * Los resultados de OCR se cachean en data/ocr-cache por hash de imagen para
 * no pagar dos veces. Se escribe data/results/<set>.csv con una fila por columna.
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDataNode } from "@kore/data";
import { createLocator, type LocateResult } from "@kore/core";
import { ClaudeVisionOcr, DiskCachedOcr, OracleOcr, parseEffort, type OcrProvider } from "@kore/ocr";

const here = path.dirname(fileURLToPath(import.meta.url));
const COLUMNS = path.resolve(here, "../data/columns");
const CACHE = path.resolve(here, "../data/ocr-cache");
const RESULTS = path.resolve(here, "../data/results");
const TRUTH = path.resolve(here, "../truth");

interface Truth {
  offset?: number;
  /** tramos de archivos con distinto desfasaje respecto de la columna estándar */
  segments?: Array<{ from: number; to: number; offset: number }>;
  columns?: Record<string, { startWord: number; endWord: number }>;
}

interface Args {
  set: string;
  provider: "claude" | "oracle";
  limit: number;
  start: number;
  cer: number;
  model: string | undefined;
  effort: string | undefined;
  maxLines: number | undefined;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { set: "shannon", provider: "claude", limit: Infinity, start: 1, cer: 0.15, model: undefined, effort: undefined, maxLines: undefined };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    const v = argv[i + 1];
    if (k === "--set" && v) a.set = v;
    else if (k === "--provider" && (v === "claude" || v === "oracle")) a.provider = v;
    else if (k === "--limit" && v) a.limit = Number(v);
    else if (k === "--start" && v) a.start = Number(v);
    else if (k === "--cer" && v) a.cer = Number(v);
    else if (k === "--model" && v) a.model = v;
    else if (k === "--effort" && v) a.effort = v;
    else if (k === "--max-lines" && v) a.maxLines = Number(v);
  }
  return a;
}

function loadTruth(set: string): Truth {
  const p = path.join(TRUTH, `${set}.json`);
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as Truth) : {};
}

function overlaps(a: { startWord: number; endWord: number }, b: { startWord: number; endWord: number }): boolean {
  const overlap = Math.min(a.endWord, b.endWord) - Math.max(a.startWord, b.startWord) + 1;
  const shorter = Math.min(a.endWord - a.startWord, b.endWord - b.startWord) + 1;
  return overlap >= shorter * 0.5;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const data = loadDataNode();
  const locator = createLocator(data, { debug: true });
  const truth = loadTruth(args.set);
  const dir = path.join(COLUMNS, args.set);
  if (!fs.existsSync(dir)) {
    console.error(`No existe ${dir}. Corré download y split primero.`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort()
    .slice(args.start - 1, args.start - 1 + args.limit);

  const expectedColumn = (file: string): number | null => {
    const k = Number(file.replace(/\D/g, ""));
    let offset = truth.offset;
    if (truth.segments) offset = truth.segments.find((s) => k >= s.from && k <= s.to)?.offset;
    if (offset === undefined) return null;
    const col = k - offset;
    return col >= 1 && col <= 245 ? col : null;
  };
  const expectedSpan = (file: string): { startWord: number; endWord: number } | null => {
    const key = file.replace(/\.\w+$/, "");
    if (truth.columns?.[key]) return truth.columns[key]!;
    const col = expectedColumn(file);
    if (col === null) return null;
    const c = data.layout.columns[col - 1]!;
    return { startWord: c.startWord, endWord: c.endWord };
  };

  let provider: OcrProvider;
  if (args.provider === "oracle") {
    provider = new OracleOcr({
      layout: data.layout,
      columnOf: () => 1, // se pisa por archivo más abajo
      charErrorRate: args.cer,
    });
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Falta ANTHROPIC_API_KEY para el proveedor claude. Usá --provider oracle para probar la cañería.");
      process.exit(1);
    }
    const claude = new ClaudeVisionOcr({
      ...(args.model ? { model: args.model } : {}),
      ...(args.effort ? { effort: parseEffort(args.effort) } : {}),
      ...(args.maxLines !== undefined ? { maxLines: args.maxLines } : {}),
    });
    console.log(`OCR: ${claude.model} | esfuerzo ${claude.effort} | hasta ${claude.maxLines} líneas`);
    provider = new DiskCachedOcr(claude, CACHE, claude.cacheSalt);
  }

  fs.mkdirSync(RESULTS, { recursive: true });
  const tag = args.provider === "claude" ? `${args.model ?? process.env.OCR_MODEL ?? "claude-opus-5"}-${args.effort ?? process.env.OCR_EFFORT ?? "low"}-${args.maxLines ?? process.env.OCR_MAX_LINES ?? 14}` : "oracle";
  const csvPath = path.join(RESULTS, `${args.set}-${tag}.csv`);
  const rows: string[] = ["file,expected_col,status,pred_col,pred_start,pred_end,hit,score,margin,aligned,tokens,lines,ocr_ms,in_tok,out_tok,cached"];

  let n = 0;
  let hits = 0;
  let confOk = 0;
  let confWrong = 0;
  let ambiguous = 0;
  let insufficient = 0;
  let errors = 0;
  let ocrMs = 0;
  let inTok = 0;
  let outTok = 0;

  for (const file of files) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(dir, file)));
    const mime = file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const expCol = expectedColumn(file);
    const expSpan = expectedSpan(file);
    let res: LocateResult | null = null;
    let meta = { ms: 0, inputTokens: 0, outputTokens: 0, cached: false };
    try {
      const p =
        args.provider === "oracle" && expCol !== null
          ? new OracleOcr({ layout: data.layout, columnOf: () => expCol, charErrorRate: args.cer, seed: expCol })
          : provider;
      const out = await p.recognize({ bytes, mime });
      meta = { ms: out.meta.ms, inputTokens: out.meta.inputTokens ?? 0, outputTokens: out.meta.outputTokens ?? 0, cached: Boolean(out.meta.cached) };
      res = locator.locate(out.result);
      n++;
    } catch (err) {
      errors++;
      console.error(`✗ ${file}: ${(err as Error).message}`);
      rows.push(`${file},${expCol ?? ""},error,,,,,,,,,,,,,`);
      continue;
    }
    ocrMs += meta.ms;
    inTok += meta.inputTokens;
    outTok += meta.outputTokens;
    const best = res.best ?? res.alternatives[0];
    const hit = expSpan && best ? overlaps(best.span, expSpan) : null;
    if (hit) hits++;
    if (res.status === "confident") {
      if (hit === false) confWrong++;
      else confOk++;
    } else if (res.status === "ambiguous") ambiguous++;
    else insufficient++;
    const predCol = best?.standardColumn?.column ?? "";
    rows.push(
      [
        file,
        expCol ?? "",
        res.status,
        predCol,
        best?.span.startWord ?? "",
        best?.span.endWord ?? "",
        hit === null ? "" : hit ? 1 : 0,
        best?.confidence.score ?? "",
        best?.confidence.margin ?? "",
        best?.confidence.alignedTokens ?? "",
        res.debug?.tokens ?? "",
        best?.layout.linesTranscribed ?? "",
        meta.ms,
        meta.inputTokens,
        meta.outputTokens,
        meta.cached ? 1 : 0,
      ].join(","),
    );
    const mark = res.status === "confident" ? (hit === false ? "✗✗" : "✓ ") : res.status === "ambiguous" ? "? " : "· ";
    console.log(`${mark} ${file} esperado ${expCol ?? "?"} → ${res.status} col ${predCol || "-"} score ${best?.confidence.score ?? "-"} margen ${best?.confidence.margin ?? "-"} ${meta.cached ? "(cache)" : `${meta.ms} ms`}`);
  }
  fs.writeFileSync(csvPath, rows.join("\n") + "\n");

  console.log("\nResumen", args.set, args.provider);
  console.log(`columnas evaluadas: ${n} | errores de OCR: ${errors}`);
  if (n > 0) {
    console.log(`top-1: ${((hits / n) * 100).toFixed(1)} %`);
    console.log(`confident correctas: ${confOk} | confident EQUIVOCADAS: ${confWrong} | ambiguas: ${ambiguous} | insuficientes: ${insufficient}`);
    console.log(`OCR: ${(ocrMs / n).toFixed(0)} ms promedio | tokens entrada ${inTok} salida ${outTok}`);
  }
  console.log(`detalle: ${csvPath}`);
}

main();
