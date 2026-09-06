"use client";

import type { Navigation, Placement } from "@kore/core";
import { versesEs } from "@/lib/format";
import { linksFor } from "@/lib/links";
import type { TargetInfo } from "@/lib/target-types";
import { Links } from "./Links";
import { MetaLine, type ScanMeta } from "./ResultCard";

interface Props {
  navigation: Navigation;
  target: TargetInfo;
  placement: Placement;
  meta: ScanMeta | null;
  hasNext: boolean;
  voice: boolean;
  onToggleVoice: () => void;
  onAgain: () => void;
  onNextTarget: () => void;
  onChangeTarget: () => void;
}

export function NavigationCard({ navigation: nav, target, placement: p, meta, hasNext, voice, onToggleVoice, onAgain, onNextTarget, onChangeTarget }: Props) {
  const here = nav.status === "here";
  const arrow = nav.direction === "towards-bereshit" ? "→" : "←";
  const sideLabel = nav.direction === "towards-bereshit" ? "hacia Bereshit" : "hacia Devarim";
  const sideHint = nav.direction === "towards-bereshit" ? "las columnas de la derecha" : "las columnas de la izquierda";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted">Objetivo</div>
          <div className="truncate text-base font-medium">{target.label}</div>
        </div>
        <button type="button" onClick={onChangeTarget} className="h-10 shrink-0 rounded-xl border border-line px-3 text-sm">
          Cambiar
        </button>
      </div>

      {here ? (
        <section className="mt-5 rounded-2xl bg-ok/10 p-5 ring-1 ring-ok/40">
          <div className="text-sm font-medium text-ok">Llegaste</div>
          <div className="mt-1 text-2xl font-semibold">{target.label}</div>
          {nav.line && (
            <>
              <div className="mt-4 text-base">
                Empieza {nav.line.exact ? "en la" : "cerca de la"} <b className="text-accent">línea {nav.line.line}</b>
                {nav.line.atLineStart ? ", al principio de la línea" : ", en el medio de la línea"}.
              </div>
              <div className="mt-2 text-xs uppercase tracking-wide text-muted">Con las palabras</div>
              <div className="hebrew mt-1 text-3xl leading-snug">{nav.line.firstWords}</div>
              {nav.line.gapBefore !== "none" && (
                <div className="mt-3 text-sm text-muted">
                  {nav.line.gapBefore === "petucha"
                    ? "Antes hay un espacio en blanco hasta el final de la línea anterior."
                    : "Antes hay un espacio en blanco dentro de la línea."}
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="mt-5 rounded-2xl bg-panel p-5">
          <div className="flex items-center gap-5">
            <div className="text-7xl leading-none text-accent" aria-hidden>
              {arrow}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold">
                Rolá {sideLabel}
              </div>
              <div className="text-sm text-muted">{sideHint}</div>
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            {nav.columns !== null ? (
              <>
                <div className="text-6xl font-semibold tabular-nums">{nav.columns}</div>
                <div className="text-lg">
                  {nav.columns === 1 ? "columna" : "columnas"}
                  {nav.columnsExact ? "" : " aprox."}
                </div>
              </>
            ) : (
              <div className="text-base text-muted">Todavía no puedo estimar cuántas columnas faltan. Rolá un poco y volvé a escanear.</div>
            )}
          </div>
          {!nav.columnsExact && nav.columns !== null && (
            <div className="mt-2 text-xs text-muted">
              Este sefer no tiene el layout estándar: la cuenta se ajusta con cada escaneo.
            </div>
          )}
        </section>
      )}

      <section className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm">
        <div className="text-xs uppercase tracking-wide text-muted">Ahora estás en</div>
        <div className="mt-1 text-base">
          {p.book.name.es} · {p.parashot.map((x) => x.name.es).join(" y ")}
          {p.standardColumn ? ` · columna ${p.standardColumn.column}` : ""}
        </div>
        <div className="text-muted">{versesEs(p)}</div>
        <div className="mt-3">
          <Links links={linksFor(p.verses.start, p.verses.end)} compact />
        </div>
      </section>

      <section className="mt-4 flex items-center justify-between rounded-2xl bg-panel-2 px-4 py-3 text-sm">
        <span className="text-muted">Objetivo en</span>
        <Links links={target.links} compact />
      </section>

      {meta && <MetaLine meta={meta} />}

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onToggleVoice}
            aria-pressed={voice}
            className={`h-12 flex-1 rounded-xl border text-sm ${voice ? "border-accent bg-accent/15 text-accent" : "border-line text-fg"}`}
          >
            {voice ? "Voz activada" : "Leer en voz alta"}
          </button>
          {here && hasNext && (
            <button type="button" onClick={onNextTarget} className="h-12 flex-1 rounded-xl border border-line text-sm">
              Siguiente aliá
            </button>
          )}
        </div>
        <button type="button" onClick={onAgain} className="h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
          {here ? "Volver a verificar" : "Rolé, escanear de nuevo"}
        </button>
      </div>
    </main>
  );
}
