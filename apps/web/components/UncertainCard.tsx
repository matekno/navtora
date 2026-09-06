"use client";

import type { LocateResult, OcrResult } from "@kore/core";
import { aliyotEs, versesEs } from "@/lib/format";
import { MetaLine, type ScanMeta } from "./ResultCard";

interface Props {
  result: LocateResult;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  error?: string | null;
  onAgain: () => void;
  onManual: () => void;
}

export function UncertainCard({ result, ocr, meta, error, onAgain, onManual }: Props) {
  const ambiguous = result.status === "ambiguous";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <span className={`self-start rounded-full px-3 py-1 text-sm font-medium ${ambiguous ? "bg-warn/15 text-warn" : "bg-bad/15 text-bad"}`}>
        {error ? "No se pudo leer" : ambiguous ? "Más de un lugar posible" : "No pude ubicarlo con seguridad"}
      </span>

      <section className="mt-6 rounded-2xl bg-panel p-5">
        {error ? (
          <p className="leading-relaxed">{error}</p>
        ) : (
          <>
            <h2 className="text-lg font-medium">Qué pasó</h2>
            <ul className="mt-2 space-y-1 text-[15px] leading-relaxed text-fg">
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            {result.suggestions.length > 0 && (
              <>
                <h2 className="mt-5 text-lg font-medium">Qué probar</h2>
                <ul className="mt-2 space-y-1 text-[15px] leading-relaxed text-muted">
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      {result.alternatives.length > 0 && (
        <section className="mt-4">
          <h2 className="px-1 text-sm uppercase tracking-wide text-muted">{ambiguous ? "Candidatos" : "Lo más parecido, sin garantía"}</h2>
          <ul className="mt-2 space-y-3">
            {result.alternatives.map((alt, i) => (
              <li key={i} className="rounded-2xl bg-panel p-4">
                <div className="text-base font-medium">
                  {alt.book.name.es} · {alt.parashot.map((x) => x.name.es).join(" y ")}
                </div>
                <div className="text-sm text-muted">
                  {capitalize(aliyotEs(alt))} · {versesEs(alt)}
                  {alt.standardColumn ? ` · columna ${alt.standardColumn.column}` : ""}
                </div>
                <div className="hebrew mt-2 text-xl">{alt.firstWordsVocalized ?? alt.firstWords}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ocr && ocr.lines.length > 0 && (
        <details className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm">
          <summary className="cursor-pointer text-muted">Lo que se leyó de la foto ({ocr.lines.length} líneas)</summary>
          <ol className="hebrew mt-3 space-y-1 text-base leading-relaxed">
            {ocr.lines.map((l, i) => (
              <li key={i} className={l.uncertain ? "text-muted" : ""}>
                {l.text}
              </li>
            ))}
          </ol>
        </details>
      )}

      {meta && <MetaLine meta={meta} />}

      <div className="mt-auto flex gap-3 pt-6">
        <button type="button" onClick={onManual} className="h-14 flex-1 rounded-2xl border border-line text-base text-fg">
          Tipear palabras
        </button>
        <button type="button" onClick={onAgain} className="h-14 flex-[2] rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
          Volver a escanear
        </button>
      </div>
    </main>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
