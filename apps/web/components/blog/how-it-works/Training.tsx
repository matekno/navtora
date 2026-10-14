/** Figures of the training appendix: how a synthetic photo is made, the fonts, finished photos and labeled line crops. */
import { FAMILY_NAMES, SYNTH_STAGES, TRAIN, type SynthStage } from "@/lib/blog/training";
import type { Locale } from "@/lib/i18n";
import { Figure } from "./Figures";

const IMG = "/blog/how-it-works/training";

const TEXT = {
  es: {
    stages: { text: "El texto", ink: "La tinta", parchment: "El pergamino", camera: "La cámara", light: "La luz", final: "La foto final" } as Record<SynthStage, string>,
    shuffled: "palabras mezcladas",
    share: (p: string) => `${p} de las fotos`,
    column: (n: number) => `columna ${n}`,
  },
  en: {
    stages: { text: "The text", ink: "The ink", parchment: "The parchment", camera: "The camera", light: "The light", final: "The final photo" } as Record<SynthStage, string>,
    shuffled: "shuffled words",
    share: (p: string) => `${p} of the photos`,
    column: (n: number) => `column ${n}`,
  },
} satisfies Record<Locale, unknown>;

/** One training photo after each step of its making. */
export function SynthStagesFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  return (
    <Figure caption={caption}>
      <ol className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
        {SYNTH_STAGES.map((s, i) => {
          const [w, h] = TRAIN.stage.sizes[s];
          return (
            <li key={s}>
              <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-ink">
                <img src={`${IMG}/stage-${s}.webp`} alt="" width={w} height={h} loading="lazy" className="max-h-full max-w-full" />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                <span className="me-1.5 font-semibold text-accent">{i + 1}</span>
                {t.stages[s]}
              </p>
            </li>
          );
        })}
      </ol>
    </Figure>
  );
}

/** Each font family, the share of photos written in it, and a specimen. */
export function FontsFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const { width, rowHeight, rows } = TRAIN.fonts;
  // the specimens are right-aligned in the image and take its right 60%
  const from = width * 0.36;
  const pct = new Intl.NumberFormat(lang === "es" ? "es-AR" : "en-US", { style: "percent", maximumFractionDigits: 0 });
  return (
    <Figure caption={caption}>
      <ul className="divide-y divide-line/60">
        {rows.map((r, i) => (
          <li key={r.family} className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-center gap-3 py-1.5">
            <div>
              <p className="text-sm text-fg">{FAMILY_NAMES[r.family] ?? r.family}</p>
              <p className="text-xs text-muted">{t.share(pct.format(r.share))}</p>
            </div>
            <svg viewBox={`${from} ${i * rowHeight} ${width - from} ${rowHeight}`} className="block w-full rounded-md" role="img" aria-label={FAMILY_NAMES[r.family] ?? r.family}>
              <image href={`${IMG}/fonts.webp`} x={0} y={0} width={width} height={rowHeight * rows.length} />
            </svg>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/** A few finished training photos. */
export function SynthGalleryFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  return (
    <Figure caption={caption}>
      <div className="columns-2 gap-3 sm:columns-3">
        {TRAIN.gallery.map((g) => (
          <figure key={g.file} className="mb-3 break-inside-avoid">
            <img src={`${IMG}/${g.file}`} alt="" width={g.width} height={g.height} loading="lazy" className="w-full rounded-lg" />
            <figcaption className="mt-1 text-xs text-muted">
              {FAMILY_NAMES[g.family] ?? g.family}
              {g.shuffled ? `, ${t.shuffled}` : `, ${t.column(g.column)}`}
            </figcaption>
          </figure>
        ))}
      </div>
    </Figure>
  );
}

/** Line crops as the network gets them, flipped back to reading order, with the text each one was labeled with. */
export function LabeledCropsFigure({ lang, caption }: { lang: Locale; caption: React.ReactNode }) {
  const t = TEXT[lang];
  const { width, height, rows } = TRAIN.crops;
  return (
    <Figure caption={caption}>
      <ul className="space-y-5">
        {rows.map((r) => (
          <li key={r.top}>
            <div className="rounded-md bg-white p-1">
              <div className="ms-auto" style={{ width: `${(r.width / width) * 100}%` }}>
                <svg viewBox={`${width - r.width} ${r.top} ${r.width} ${height}`} className="block w-full" role="img" aria-hidden>
                  <image href={`${IMG}/crops.webp`} x={0} y={0} width={width} height={height * rows.length} />
                </svg>
              </div>
            </div>
            <p className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3" dir="rtl">
              <span className="scroll-text text-lg text-ok">{r.label}</span>
              {r.shuffled && (
                <span className="text-xs text-muted" dir="ltr">
                  {t.shuffled}
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </Figure>
  );
}
