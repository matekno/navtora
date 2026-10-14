/** The figures between the paragraphs of the "how it works" post, all drawn from FIG. */
import { BOOK_NAMES } from "@navtora/core";
import { FIG, KIND_COLOR, type PairKind } from "@/lib/blog/how-it-works";
import type { Locale } from "@/lib/i18n";

const IMG = "/blog/how-it-works";

const TEXT = {
  es: {
    steps: "pasos de 4 píxeles (el punto es «nada»)",
    unsure: "menos del 50 %",
    read: "Leyó",
    scroll: "En el sefer",
    kinds: { same: "igual", confusable: "letras que se confunden", wildcard: "con ?", different: "distinta", extra: "sobra" } as Record<PairKind, string>,
    best: "Mejor lugar",
    second: "Segundo",
    here: "Acá está abierto",
    target: "Devarim 1:1",
    columns: (n: number) => `${n} columnas`,
    column: "columna",
    votesLabel: "Votos por el lugar donde empieza la foto, a lo largo de toda la Torá",
  },
  en: {
    steps: "4-pixel steps (a dot means “nothing”)",
    unsure: "below 50%",
    read: "Read",
    scroll: "In the sefer",
    kinds: { same: "same", confusable: "easily confused letters", wildcard: "with ?", different: "different", extra: "extra" } as Record<PairKind, string>,
    best: "Best place",
    second: "Runner-up",
    here: "Open here",
    target: "Deuteronomy 1:1",
    columns: (n: number) => `${n} columns`,
    column: "column",
    votesLabel: "Votes for where the photo starts, across the whole Torah",
  },
} satisfies Record<Locale, unknown>;

export function Figure({ children, caption }: { children: React.ReactNode; caption?: React.ReactNode }) {
  return (
    <figure className="my-8">
      <div className="rounded-2xl border border-line/70 bg-panel p-4 sm:p-5">{children}</div>
      {caption && <figcaption className="mt-3 text-sm leading-relaxed text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** One line crop out of lines.webp; `flip` shows it the way people read it rather than the way the network gets it. */
export function Crop({ index, flip = false, from = 0, to, className = "" }: { index: number; flip?: boolean; from?: number; to?: number; className?: string }) {
  const line = FIG.lines[index]!;
  const x1 = to ?? line.crop.width;
  return (
    <svg viewBox={`${from} ${line.crop.top} ${x1 - from} ${FIG.cropHeight}`} className={`block w-full ${flip ? "-scale-x-100" : ""} ${className}`} role="img" aria-hidden>
      <image href={`${IMG}/lines.webp`} x={0} y={0} width={FIG.cropWidth} height={FIG.cropHeight * FIG.lines.length} preserveAspectRatio="none" />
    </svg>
  );
}

/** The first lines' crops as the network gets them, and as we read them. */
export function CropsFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const rows = [0, 1, 2, 3, 4, 5];
  const labels = lang === "es" ? ["Como la recibe la red", "Dada vuelta, como la leemos"] : ["As the network gets it", "Flipped back, as we read it"];
  return (
    <Figure caption={caption}>
      <div className="grid gap-6 sm:grid-cols-2">
        {[false, true].map((flip, k) => (
          <div key={k}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{labels[k]}</p>
            <div className="space-y-1.5 rounded-lg bg-white p-2">
              {rows.map((i) => (
                <div key={i} style={{ width: `${(FIG.lines[i]!.crop.width / FIG.cropWidth) * 100}%` }} className={flip ? "ml-auto" : ""}>
                  <Crop index={i} flip={flip} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

/** What the network says at each step of one line, how the steps collapse into letters, and the scroll's words. */
export function CtcFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const steps = FIG.ctc.steps;
  // the first two words: up to the second space
  const spaces = steps.flatMap((s, i) => (s.c === " " ? [i] : []));
  const end = Math.min(steps.length, spaces[1] ?? 40);
  const shown = steps.slice(0, end);
  const { read, truth } = FIG.ctc;
  return (
    <Figure caption={caption}>
      {/* rtl so that on narrow screens it opens scrolled to the start of the line, on the right */}
      <div className="overflow-x-auto" dir="rtl">
        <div className="min-w-[520px]" dir="ltr">
          <div className="rounded-md bg-white p-1">
            <Crop index={FIG.ctc.line} flip from={0} to={end * 4} />
          </div>
          <div className="mt-1 flex" dir="rtl">
            {shown.map((s, i) => (
              <span
                key={i}
                className={`scroll-text flex-1 border-s border-line/40 text-center text-[15px] leading-7 ${s.c === "" ? "text-muted/50" : s.c === " " ? "" : s.p < 0.5 ? "text-warn" : "text-fg"}`}
                style={s.c && s.c !== " " ? { opacity: 0.35 + 0.65 * s.p } : undefined}
                title={s.c ? `${Math.round(s.p * 100)}%` : undefined}
              >
                {s.c === "" ? "·" : s.c === " " ? "␣" : s.c}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {t.steps} · <span className="text-warn">{t.unsure}</span> → ?
          </p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2">
        <dt className="text-sm text-muted">{t.read}</dt>
        <dd className="scroll-text text-2xl" dir="rtl">
          {read.map((w, i) => (
            <span key={i}>
              {w.split(/(\?+)/).map((p, k) => (p.startsWith("?") ? <span key={k} className="text-warn">{p}</span> : p))}{" "}
            </span>
          ))}
        </dd>
        <dt className="text-sm text-muted">{t.scroll}</dt>
        <dd className="scroll-text text-2xl text-ok" dir="rtl">
          {truth.join(" ")}
        </dd>
      </dl>
    </Figure>
  );
}

/** Votes over the whole Torah, Bereshit on the right as in the scroll. */
export function VotesFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const W = 380;
  const H = 110;
  const n = FIG.votes.length;
  const bw = W / n;
  const xOfWord = (w: number) => W - (w / FIG.torahWords) * W;
  const peak = FIG.votes.indexOf(Math.max(...FIG.votes));
  const peakX = W - (peak + 0.5) * bw;
  const books = FIG.books.map((start, i) => ({ n: i + 1, start, end: FIG.books[i + 1] ?? FIG.torahWords }));
  return (
    <Figure caption={caption}>
      <svg viewBox={`0 0 ${W} ${H + 46}`} className="w-full" role="img" aria-label={t.votesLabel}>
        {FIG.votes.map((v, i) => (
          <rect key={i} x={W - (i + 1) * bw + 0.3} y={H - Math.max(0.6, v * H)} width={Math.max(0.6, bw - 0.6)} height={Math.max(0.6, v * H)} fill={i === peak ? "var(--color-accent)" : "var(--color-muted)"} opacity={i === peak ? 1 : 0.7} />
        ))}
        <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} stroke="var(--color-line)" />
        {books.map((b, i) => (
          <g key={b.n}>
            <rect x={xOfWord(b.end)} y={H + 6} width={xOfWord(b.start) - xOfWord(b.end) - 2} height={20} rx={4} fill={i % 2 ? "var(--color-panel-2)" : "var(--color-line)"} />
            <text x={(xOfWord(b.start) + xOfWord(b.end)) / 2} y={H + 20} textAnchor="middle" fontSize={10} fill="var(--color-muted)">
              {BOOK_NAMES[b.n]?.[lang]}
            </text>
          </g>
        ))}
        <text x={peakX + 6} y={12} fontSize={11} fill="var(--color-accent)" fontWeight={600}>
          ← {FIG.result.parasha?.[lang]}
        </text>
        <text x={W} y={H + 40} textAnchor="end" fontSize={9} fill="var(--color-muted)">
          → {BOOK_NAMES[1]?.[lang]}
        </text>
      </svg>
    </Figure>
  );
}

/** A few lines: each word as read over the scroll's word, colored by how they differ. */
export function AlignmentFigure({ lang, lines, caption }: { lang: Locale; lines: number[]; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const kinds: PairKind[] = ["same", "confusable", "wildcard", "different", "extra"];
  return (
    <Figure caption={caption}>
      <div className="space-y-4">
        {lines.map((li) => {
          const ocrLine = FIG.lines[li]?.ocrLine;
          const pairs = FIG.alignment.filter((a) => a.line === ocrLine);
          return (
            <div key={li} className="flex flex-wrap gap-1.5" dir="rtl">
              {pairs.map((p, i) => (
                <div key={i} className="rounded-lg border-b-[3px] bg-panel-2 px-2 pt-1 pb-1.5 text-center" style={{ borderColor: KIND_COLOR[p.kind] }}>
                  <div className="scroll-text text-lg leading-6">
                    {p.read.split(/(\?+)/).map((s, k) => (s.startsWith("?") ? <span key={k} className="text-warn">{s}</span> : s))}
                  </div>
                  <div className="scroll-text text-sm leading-5 text-muted">{p.word ?? "—"}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <span>
          <span className="scroll-text text-fg">אב</span> {t.read} · <span className="scroll-text">אב</span> {t.scroll}
        </span>
        {kinds.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[3px] w-4 rounded" style={{ background: KIND_COLOR[k] }} />
            {t.kinds[k]}
          </span>
        ))}
      </div>
    </Figure>
  );
}

/** The best candidate against the runner-up. */
export function ScoreFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const r = FIG.result;
  const rows = [
    { label: `${t.best}: ${r.parasha?.[lang]}, ${t.column} ${r.column}`, v: r.score, color: "var(--color-accent)" },
    { label: t.second, v: r.second ?? 0, color: "var(--color-muted)" },
  ];
  const fmt = new Intl.NumberFormat(lang === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 1 });
  return (
    <Figure caption={caption}>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm">
              <span className="text-fg">{row.label}</span>
              <span className="tabular-nums text-muted">{fmt.format(row.v)}</span>
            </div>
            <div className="mt-1.5 h-3 rounded-full bg-panel-2">
              <div className="h-3 rounded-full" style={{ width: `${(row.v / r.score) * 100}%`, background: row.color }} />
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

/** Columns around the photo, the one it shows and the target, laid out right to left like the scroll. */
export function MoveFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const here = FIG.result.column ?? 0;
  const target = FIG.navigation.targetColumn;
  const cols = Array.from({ length: 6 }, (_, i) => Math.min(here, target) - 2 + i);
  const W = 380;
  const cw = 46;
  const gap = (W - cols.length * cw) / (cols.length - 1);
  const xOf = (n: number) => W - (n - cols[0]! + 1) * cw - (n - cols[0]!) * gap;
  const hereX = xOf(here) + cw / 2;
  const targetX = xOf(target) + cw / 2;
  return (
    <Figure caption={caption}>
      <svg viewBox={`0 0 ${W} 214`} className="mx-auto w-full max-w-[460px]" role="img" aria-label={`${t.here}: ${here}. ${t.target}: ${target}.`}>
        <defs>
          <marker id="move-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-accent)" />
          </marker>
        </defs>
        {cols.map((n) => {
          const x = xOf(n);
          const hl = n === here || n === target;
          return (
            <g key={n}>
              <rect x={x} y={56} width={cw} height={110} rx={6} fill={n === here ? "rgb(245 196 81 / 0.16)" : n === target ? "rgb(76 209 138 / 0.14)" : "var(--color-panel-2)"} stroke={n === here ? "var(--color-accent)" : n === target ? "var(--color-ok)" : "var(--color-line)"} strokeWidth={hl ? 2 : 1} />
              {Array.from({ length: 9 }, (_, k) => (
                <line key={k} x1={x + 7} x2={x + cw - 7 - (k % 3) * 3} y1={70 + k * 10.5} y2={70 + k * 10.5} stroke="var(--color-muted)" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
              ))}
              <text x={x + cw / 2} y={186} textAnchor="middle" fontSize={12} fill={hl ? "var(--color-fg)" : "var(--color-muted)"}>
                {n}
              </text>
            </g>
          );
        })}
        <text x={hereX} y={206} textAnchor="middle" fontSize={10} fill="var(--color-accent)">
          {t.here}
        </text>
        <text x={targetX} y={206} textAnchor="middle" fontSize={10} fill="var(--color-ok)">
          {t.target}
        </text>
        <path d={`M${hereX},50 C${hereX - 20},24 ${targetX + 20},24 ${targetX},50`} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} markerEnd="url(#move-arrow)" />
        <text x={(hereX + targetX) / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-accent)">
          {t.columns(Math.abs(target - here))}
        </text>
      </svg>
    </Figure>
  );
}
