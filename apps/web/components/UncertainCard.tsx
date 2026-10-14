"use client";

import type { LocateResult, OcrResult } from "@navtora/core";
import { aliyotLabel, capitalize, parashotLabel, versesLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { MetaLine, OcrLines, type ScanMeta } from "./ResultCard";

interface Props {
  result: LocateResult;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  error?: string | null;
  /** feedback, above the meta line */
  footer?: React.ReactNode;
  onAgain: () => void;
  onManual: () => void;
}

export function UncertainCard({ result, ocr, meta, error, footer, onAgain, onManual }: Props) {
  const { t, lang } = useI18n();
  const ambiguous = result.status === "ambiguous";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <span className={`self-start rounded-full px-3 py-1 text-sm font-medium ${ambiguous ? "bg-warn/15 text-warn" : "bg-bad/15 text-bad"}`}>
        {error ? t.uncertain.error : ambiguous ? t.uncertain.ambiguous : t.uncertain.insufficient}
      </span>

      <section className="mt-6 rounded-2xl bg-panel p-5">
        {error ? (
          <p className="leading-relaxed">{error}</p>
        ) : (
          <>
            <h2 className="text-lg font-medium">{t.uncertain.whatHappened}</h2>
            <ul className="mt-2 space-y-1 text-[15px] leading-relaxed text-fg">
              {result.reasons.map((r) => (
                <li key={r}>{t.uncertain.reasons[r]}</li>
              ))}
            </ul>
            {result.suggestions.length > 0 && (
              <>
                <h2 className="mt-5 text-lg font-medium">{t.uncertain.whatToTry}</h2>
                <ul className="mt-2 space-y-1 text-[15px] leading-relaxed text-muted">
                  {result.suggestions.map((s) => (
                    <li key={s}>{t.uncertain.suggestions[s]}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      {result.alternatives.length > 0 && (
        <section className="mt-4">
          <h2 className="px-1 text-sm uppercase tracking-wide text-muted">{ambiguous ? t.uncertain.candidates : t.uncertain.closest}</h2>
          <ul className="mt-2 space-y-3">
            {result.alternatives.map((alt, i) => (
              <li key={i} className="rounded-2xl bg-panel p-4">
                <div className="text-base font-medium">
                  {alt.book.name[lang]} · {parashotLabel(alt, lang, t)}
                </div>
                <div className="text-sm text-muted">
                  {capitalize(aliyotLabel(alt, t))} · {versesLabel(alt, t)}
                  {alt.standardColumn ? ` · ${t.nav.column(alt.standardColumn.column)}` : ""}
                </div>
                <div className="hebrew mt-2 text-xl">{alt.firstWordsVocalized ?? alt.firstWords}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ocr && <OcrLines ocr={ocr} />}
      {footer}
      {meta && <MetaLine meta={meta} />}

      <div className="mt-auto flex gap-3 pt-6">
        <button type="button" onClick={onManual} className="h-14 flex-1 rounded-2xl border border-line text-base text-fg">
          {t.uncertain.typeWords}
        </button>
        <button type="button" onClick={onAgain} className="h-14 flex-[2] rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
          {t.uncertain.rescan}
        </button>
      </div>
    </main>
  );
}
