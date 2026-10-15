/**
 * Figures of the post on how the network was trained: how a synthetic photo is
 * made, the fonts, finished photos, labeled line crops, and real sifrei as the
 * app read them.
 */
import { BOOK_NAMES } from "@navtora/core";
import { KIND_COLOR, type PairKind } from "@/lib/blog/how-it-works";
import { BL_SHEET, FAMILY_NAMES, REAL, SYNTH_STAGES, TRAIN, type SynthStage } from "@/lib/blog/training";
import type { Locale } from "@/lib/i18n";
import { Figure } from "../Figure";
import { PhotoToggle } from "./PhotoToggle";

const IMG = "/blog/training";

const TEXT = {
  es: {
    stages: { text: "El texto", ink: "La tinta", parchment: "El pergamino", camera: "La cámara", light: "La luz", final: "La foto final" } as Record<SynthStage, string>,
    shuffled: "palabras mezcladas",
    share: (p: string) => `${p} de las fotos`,
    column: (n: number) => `columna ${n}`,
    toggle: { photo: "Ver la foto sola", analysis: "Ver lo que encontró la app" },
    kinds: { same: "igual", confusable: "letras que se confunden, o con ?", different: "distinta" } as Record<string, string>,
    left: "no entró en la comparación",
  },
  en: {
    stages: { text: "The text", ink: "The ink", parchment: "The parchment", camera: "The camera", light: "The light", final: "The final photo" } as Record<SynthStage, string>,
    shuffled: "shuffled words",
    share: (p: string) => `${p} of the photos`,
    column: (n: number) => `column ${n}`,
    toggle: { photo: "Show the photo alone", analysis: "Show what the app found" },
    kinds: { same: "same", confusable: "easily confused letters, or with ?", different: "different" } as Record<string, string>,
    left: "left out of the comparison",
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

/** A real sefer shown in RealSifreiFigure: its photo id and what the post says about it. */
export interface RealSefer {
  id: string;
  name: string;
  detail: string;
  credit: React.ReactNode;
}

/** Where the app placed a photo: verse, parasha and, for a standard-layout sefer, the column. */
function placedAt(id: string, lang: Locale, withColumn: boolean): string {
  const t = TEXT[lang];
  const r = REAL[id];
  if (!r?.verses) return "";
  const v = r.verses.start;
  const parts = [`${BOOK_NAMES[v.book]?.[lang]} ${v.chapter}:${v.verse}`, r.parasha?.[lang]];
  if (withColumn && r.column !== null) parts.push(t.column(r.column));
  return parts.filter(Boolean).join(" · ");
}

function MatchLegend({ lang }: { lang: Locale }) {
  const t = TEXT[lang];
  const kinds: PairKind[] = ["same", "confusable", "different"];
  return (
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line/60 pt-4 text-xs text-muted">
      {kinds.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ background: KIND_COLOR[k], opacity: 0.75 }} />
          {t.kinds[k]}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm border border-dashed border-fg/60" />
        {t.left}
      </span>
    </div>
  );
}

/** One column of each of a few real sifrei, with what the app found drawn over it. */
export function RealSifreiFigure({ lang, sifrei, caption, withColumn = [] }: { lang: Locale; sifrei: RealSefer[]; caption: React.ReactNode; withColumn?: string[] }) {
  const t = TEXT[lang];
  return (
    <Figure caption={caption}>
      <div className="grid gap-8 sm:grid-cols-3 sm:items-start sm:gap-5">
        {sifrei.map((s) => {
          const r = REAL[s.id]!;
          return (
            <div key={s.id}>
              <PhotoToggle src={`${IMG}/real/${s.id}`} width={r.width} height={r.height} labels={t.toggle} imgClassName="max-h-[520px] w-auto max-w-full" />
              <p className="mt-3 text-sm font-medium text-fg">{s.name}</p>
              <p className="text-xs text-muted">{s.detail}</p>
              <p className="mt-1.5 text-xs text-ok">{placedAt(s.id, lang, withColumn.includes(s.id))}</p>
              <p className="mt-1.5 text-[11px] leading-4 text-muted">{s.credit}</p>
            </div>
          );
        })}
      </div>
      <MatchLegend lang={lang} />
    </Figure>
  );
}

/** A whole sheet of the British Library scroll, and its columns one by one as the app placed them, right to left. */
export function ScrollSheetFigure({ lang, ids, credit, caption }: { lang: Locale; ids: string[]; credit: React.ReactNode; caption: React.ReactNode }) {
  const t = TEXT[lang];
  return (
    <Figure caption={caption}>
      <img src={`${IMG}/real/bl-sheet.webp`} alt="" width={BL_SHEET.width} height={BL_SHEET.height} loading="lazy" className="w-full rounded-lg" />
      <p className="mt-1.5 text-[11px] text-muted">{credit}</p>
      {/* rtl so that it opens scrolled to the first column, on the right */}
      <div className="mt-5 overflow-x-auto pb-1" dir="rtl">
        <div className="flex gap-2">
          {ids.map((id) => {
            const r = REAL[id]!;
            const v = r.verses?.start;
            return (
              <div key={id} className="w-[84px] shrink-0 text-center">
                <PhotoToggle src={`${IMG}/real/${id}`} width={r.width} height={r.height} labels={t.toggle} badge={false} imgClassName="h-[360px] w-auto" />
                <p className="mt-1.5 text-xs text-fg">{r.parasha?.[lang]}</p>
                {v && (
                  <p className="text-[11px] text-muted" dir="ltr">
                    {v.chapter}:{v.verse}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <MatchLegend lang={lang} />
    </Figure>
  );
}
