/**
 * Barrido de robustez del matcher con ruido simulado de OCR.
 *
 *   pnpm --filter @kore/eval noise -- --windows 2000 --cer 0.1,0.2,0.3,0.4 --verbose
 *
 * Métricas por tasa de error: top-1 (la posición correcta quedó primera, con o
 * sin confianza), confident-wrong (afirmó una posición equivocada: debe ser 0),
 * abstención (ambiguo o insuficiente) y tiempo medio.
 */
import { loadDataNode } from "@kore/data";
import { createLocator, makeRng, noisyLines, tokenizeHebrew, type LocateResult } from "@kore/core";

interface Args {
  windows: number;
  cers: number[];
  verbose: boolean;
  minLines: number;
  maxLines: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { windows: 500, cers: [0.1, 0.2, 0.3, 0.4], verbose: false, minLines: 6, maxLines: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--windows") args.windows = Number(argv[++i]);
    else if (a === "--cer") args.cers = String(argv[++i]).split(",").map(Number);
    else if (a === "--verbose") args.verbose = true;
    else if (a === "--lines") {
      const [lo, hi] = String(argv[++i]).split("-").map(Number);
      args.minLines = lo ?? 6;
      args.maxLines = hi ?? lo ?? 10;
    }
  }
  return args;
}

const data = loadDataNode();
const locator = createLocator(data, { debug: true });

interface Sample {
  lines: string[];
  column: number;
  firstLine: number;
  startWord: number;
  endWord: number;
}

function sample(seed: number, minLines: number, maxLines: number): Sample {
  const rng = makeRng(seed);
  const column = 1 + Math.floor(rng() * 245);
  const col = data.layout.columns[column - 1]!;
  const len = minLines + Math.floor(rng() * (maxLines - minLines + 1));
  const from = Math.floor(rng() * (col.lines.length - len));
  const lines = col.lines.slice(from, from + len).filter((l) => l.end >= l.start);
  return {
    lines: lines.map((l) => tokenizeHebrew(l.text).join(" ")).filter((l) => l.length > 0),
    column,
    firstLine: from + 1,
    startWord: lines[0]!.start,
    endWord: lines[lines.length - 1]!.end,
  };
}

/** Acierto: el span predicho se solapa con el tramo real en al menos la mitad del más corto. */
function isHit(res: LocateResult, s: Sample): boolean {
  const best = res.best ?? res.alternatives[0];
  if (!best) return false;
  const overlap = Math.min(best.span.endWord, s.endWord) - Math.max(best.span.startWord, s.startWord) + 1;
  const shorter = Math.min(best.span.endWord - best.span.startWord, s.endWord - s.startWord) + 1;
  return overlap >= shorter * 0.5;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  console.log(`ventanas: ${args.windows} | líneas por ventana: ${args.minLines}-${args.maxLines}`);
  console.log("cer   top1    conf-ok  conf-WRONG  ambiguo  insuf   ms/ventana");
  for (const cer of args.cers) {
    let top1 = 0;
    let confOk = 0;
    let confWrong = 0;
    let ambiguous = 0;
    let insufficient = 0;
    let ms = 0;
    const failures: string[] = [];
    for (let i = 1; i <= args.windows; i++) {
      const s = sample(i * 7919 + 17, args.minLines, args.maxLines);
      const noisy = noisyLines(s.lines, { charErrorRate: cer, seed: i });
      const t0 = performance.now();
      const res = locator.locate({ lines: noisy.map((text) => ({ text })) });
      ms += performance.now() - t0;
      const hit = isHit(res, s);
      if (hit) top1++;
      if (res.status === "confident") {
        if (hit) confOk++;
        else {
          confWrong++;
          const b = res.best!;
          failures.push(
            `  ✗ col ${s.column} l${s.firstLine} palabras ${s.startWord}-${s.endWord} → predijo ${b.span.startWord}-${b.span.endWord} (col ${b.standardColumn?.column ?? "?"}) score ${b.confidence.score} margen ${b.confidence.margin} alineados ${b.confidence.alignedTokens}/${res.debug?.tokens}\n` +
              `    ruido: ${noisy.join(" | ")}`,
          );
        }
      } else if (res.status === "ambiguous") ambiguous++;
      else insufficient++;
    }
    const n = args.windows;
    console.log(
      `${cer.toFixed(2)}  ${(top1 / n * 100).toFixed(1).padStart(5)}%  ${(confOk / n * 100).toFixed(1).padStart(5)}%   ${String(confWrong).padStart(6)}     ${(ambiguous / n * 100).toFixed(1).padStart(5)}%  ${(insufficient / n * 100).toFixed(1).padStart(5)}%  ${(ms / n).toFixed(1).padStart(6)}`,
    );
    if (args.verbose && failures.length > 0) {
      console.log(failures.slice(0, 12).join("\n"));
    }
  }
}

main();
