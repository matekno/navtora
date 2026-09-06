"use client";

import type { OcrResult, Placement } from "@kore/core";
import { aliyotEs, versesEs } from "@/lib/format";
import { modelLabel } from "@/lib/models";

export interface ScanMeta {
  provider?: string;
  model?: string;
  ms?: number;
  totalMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

interface Props {
  placement: Placement;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  onAgain: () => void;
}

export function ResultCard({ placement: p, ocr, meta, onAgain }: Props) {
  const parashaNames = p.parashot.map((x) => x.name.es).join(" y ");
  const col = p.standardColumn;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-ok/15 px-3 py-1 text-sm font-medium text-ok">Ubicado con seguridad</span>
        <span className="text-xs text-muted">
          {p.confidence.alignedTokens} palabras coinciden en {p.confidence.linesCovered} líneas
        </span>
      </div>

      <section className="mt-6 rounded-2xl bg-panel p-5">
        <Row label="Libro" value={p.book.name.es} hebrew={p.book.name.he} />
        <Row label={p.parashot.length > 1 ? "Parashot" : "Parashá"} value={parashaNames} hebrew={p.parashot.map((x) => x.name.he).join(" · ")} />
        <Row label="Aliá" value={capitalize(aliyotEs(p))} />
        <Row label="Versículos" value={versesEs(p)} />
        {col && (
          <Row
            label="Columna"
            value={`${col.column} de 245${col.fromColumnStart ? "" : col.firstLine ? `, desde la línea ${col.firstLine}` : ""}`}
            hint="layout estándar de 42 líneas"
          />
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-panel p-5">
        <div className="text-xs uppercase tracking-wide text-muted">Empieza con</div>
        <div className="hebrew mt-2 text-3xl leading-snug">{p.firstWordsVocalized ?? p.firstWords}</div>
        {p.aliyot.some((a) => a.startsHere) && (
          <div className="mt-3 text-sm text-accent">En esta columna empieza una aliá.</div>
        )}
      </section>

      {ocr && ocr.lines.length > 0 && (
        <details className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm">
          <summary className="cursor-pointer text-muted">Lo que se leyó de la foto ({ocr.lines.length} líneas)</summary>
          <ol className="hebrew mt-3 space-y-1 text-base leading-relaxed">
            {ocr.lines.map((l, i) => (
              <li key={i} className={l.uncertain ? "text-muted" : ""}>
                {l.gapBefore === "full" && <span className="mr-2 inline-block h-3 w-8 rounded-sm bg-line align-middle" />}
                {l.text}
              </li>
            ))}
          </ol>
        </details>
      )}

      {meta && <MetaLine meta={meta} />}

      <div className="mt-auto pt-6">
        <button type="button" onClick={onAgain} className="h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
          Escanear de nuevo
        </button>
      </div>
    </main>
  );
}

export function MetaLine({ meta }: { meta: ScanMeta }) {
  const secs = meta.totalMs !== undefined ? Math.round(meta.totalMs / 1000) : meta.ms !== undefined ? Math.round(meta.ms / 1000) : null;
  const label = modelLabel(meta.model) || meta.provider || "";
  if (!label && secs === null) return null;
  return (
    <div className="mt-3 text-center text-xs text-muted">
      {label ? `Leído con ${label}` : "Leído"}
      {secs !== null ? ` en ${secs} s` : ""}
      {meta.inputTokens && meta.outputTokens ? ` · ${meta.inputTokens + meta.outputTokens} tokens` : ""}
    </div>
  );
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
