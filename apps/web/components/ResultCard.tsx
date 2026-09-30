"use client";

import type { OcrResult, Placement } from "@navtora/core";
import { aliyotLabel, capitalize, parashotLabel, versesLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { linksFor } from "@/lib/links";
import { modelLabel } from "@/lib/models";
import type { ScrollInfo } from "@/lib/target-types";
import { Links } from "./Links";
import { ScrollMap } from "./ScrollMap";

export interface ScanMeta {
  provider?: string;
  model?: string;
  ms?: number;
  totalMs?: number;
}

interface Props {
  placement: Placement;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  scroll: ScrollInfo | null;
  onAgain: () => void;
  onPickTarget: () => void;
}

export function ResultCard({ placement: p, ocr, meta, scroll, onAgain, onPickTarget }: Props) {
  const { t, lang } = useI18n();
  const col = p.standardColumn;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-ok/15 px-3 py-1 text-sm font-medium text-ok">{t.result.badge}</span>
        <span className="text-xs text-muted">{t.result.matchStat(p.confidence.alignedTokens, p.confidence.linesCovered)}</span>
      </div>

      <section className="mt-6 rounded-2xl bg-panel p-5">
        <Row label={t.result.book} value={p.book.name[lang]} hebrew={p.book.name.he} />
        <Row
          label={p.parashot.length > 1 ? t.result.parashot : t.result.parasha}
          value={parashotLabel(p, lang, t)}
          hebrew={p.parashot.map((x) => x.name.he).join(" · ")}
        />
        <Row label={t.result.aliyah} value={capitalize(aliyotLabel(p, t))} />
        <Row label={t.result.verses} value={versesLabel(p, t)} />
        {col && <Row label={t.result.column} value={t.result.columnValue(col.column, col.fromColumnStart ? null : col.firstLine)} hint={t.result.columnHint} />}
      </section>

      {scroll && (
        <section className="mt-4 rounded-2xl bg-panel p-4">
          <ScrollMap scroll={scroll} here={p.span.startWord} />
        </section>
      )}

      <section className="mt-4 rounded-2xl bg-panel p-5">
        <div className="text-xs uppercase tracking-wide text-muted">{t.result.startsWith}</div>
        <div className="hebrew mt-2 text-3xl leading-snug">{p.firstWordsVocalized ?? p.firstWords}</div>
        {p.aliyot.some((a) => a.startsHere) && <div className="mt-3 text-sm text-accent">{t.result.aliyahStartsHere}</div>}
        <div className="mt-4">
          <Links links={linksFor(p.verses.start, p.verses.end)} compact />
        </div>
      </section>

      {ocr && <OcrLines ocr={ocr} />}
      {meta && <MetaLine meta={meta} />}

      <div className="mt-auto flex gap-3 pt-6">
        <button type="button" onClick={onPickTarget} className="h-14 flex-1 rounded-2xl border border-line text-base text-fg">
          {t.result.goTo}
        </button>
        <button type="button" onClick={onAgain} className="h-14 flex-[2] rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
          {t.result.scanAgain}
        </button>
      </div>
    </main>
  );
}

/** The raw transcription, collapsed. Uncertain lines are dimmed. */
export function OcrLines({ ocr }: { ocr: OcrResult }) {
  const { t } = useI18n();
  if (ocr.lines.length === 0) return null;
  return (
    <details className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm">
      <summary className="cursor-pointer text-muted">{t.result.ocrSummary(ocr.lines.length)}</summary>
      <ol className="hebrew mt-3 space-y-1 text-base leading-relaxed">
        {ocr.lines.map((l, i) => (
          <li key={i} className={l.uncertain ? "text-muted" : ""}>
            {l.gapBefore === "full" && <span className="mr-2 inline-block h-3 w-8 rounded-sm bg-line align-middle" />}
            {l.text}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function MetaLine({ meta }: { meta: ScanMeta }) {
  const { t } = useI18n();
  const ms = meta.totalMs ?? meta.ms;
  const label = modelLabel(meta.model) || meta.provider;
  if (!label) return null;
  return <div className="mt-3 text-center text-xs text-muted">{t.meta.readWith(label, ms !== undefined ? Math.round(ms / 1000) : null)}</div>;
}

function Row({ label, value, hebrew, hint }: { label: string; value: string; hebrew?: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-right">
        <div className="text-lg font-medium">{value}</div>
        {hebrew && <div className="hebrew text-base text-muted">{hebrew}</div>}
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
    </div>
  );
}
