"use client";

import type { Navigation, Placement } from "@navtora/core";
import { parashotLabel, versesLabel } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { linksFor } from "@/lib/links";
import { speechAvailable } from "@/lib/speech";
import type { ScrollInfo, TargetInfo } from "@/lib/target-types";
import { Links } from "./Links";
import { MetaLine, type ScanMeta } from "./ResultCard";
import { ScrollMap } from "./ScrollMap";
import { VoiceControls } from "./VoiceControls";

interface Props {
  navigation: Navigation;
  target: TargetInfo;
  placement: Placement;
  scroll: ScrollInfo | null;
  meta: ScanMeta | null;
  /** feedback and dedication, above the meta line */
  footer?: React.ReactNode;
  hasNext: boolean;
  autoVoice: boolean;
  onToggleAutoVoice: () => void;
  onListen: () => void;
  onAgain: () => void;
  onNextTarget: () => void;
  onChangeTarget: () => void;
}

export function NavigationCard(props: Props) {
  const { navigation: nav, target, placement: p, scroll, meta, footer, hasNext, onAgain, onNextTarget, onChangeTarget } = props;
  const { t, lang } = useI18n();
  const here = nav.status === "here";
  // text runs right to left, so Bereshit is to the right
  const right = nav.direction === "towards-bereshit";
  const side = right ? t.nav.toTheRight : t.nav.toTheLeft;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted">{t.nav.objective}</div>
          <div className="truncate text-base font-medium">{target.label}</div>
        </div>
        <button type="button" onClick={onChangeTarget} className="h-10 shrink-0 rounded-xl border border-line px-3 text-sm">
          {t.nav.change}
        </button>
      </div>

      {here ? (
        <section className="mt-5 rounded-2xl bg-ok/10 p-5 ring-1 ring-ok/40">
          <div className="text-sm font-medium text-ok">{t.nav.arrived}</div>
          <div className="mt-1 text-2xl font-semibold">{target.label}</div>
          {nav.line && (
            <>
              <div className="mt-4 text-base">
                {t.nav.startsAt(nav.line.exact)} <b className="text-accent">{t.nav.lineN(nav.line.line)}</b>
                {nav.line.atLineStart ? t.nav.atLineStart : t.nav.midLine}
              </div>
              <div className="mt-2 text-xs uppercase tracking-wide text-muted">{t.nav.withWords}</div>
              <div className="hebrew mt-1 text-3xl leading-snug">{nav.line.firstWordsVocalized ?? nav.line.firstWords}</div>
              {nav.line.gapBefore !== "none" && (
                <div className="mt-3 text-sm text-muted">{nav.line.gapBefore === "petucha" ? t.nav.gapPetucha : t.nav.gapSetuma}</div>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="mt-5 rounded-2xl bg-panel p-5">
          <div className="flex items-center gap-5">
            <div className="text-7xl leading-none text-accent" aria-hidden>
              {right ? "→" : "←"}
            </div>
            {nav.columns !== null ? (
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-semibold tabular-nums">{nav.columns}</span>
                  <span className="text-lg">{t.nav.columnsUnit(nav.columns, nav.columnsExact)}</span>
                </div>
                <div className="text-2xl font-semibold">{side}</div>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="text-2xl font-semibold">{t.nav.noEstimate(side)}</div>
                <div className="text-sm text-muted">{t.nav.noEstimateHint}</div>
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-muted">{right ? t.nav.towardsBereshit : t.nav.towardsDevarim}</div>
          {!nav.columnsExact && nav.columns !== null && <div className="mt-2 text-xs text-muted">{t.nav.nonStandard}</div>}
          {scroll && (
            <div className="mt-4">
              <ScrollMap scroll={scroll} here={p.span.startWord} target={target.word} />
            </div>
          )}
        </section>
      )}

      <section className="mt-4 rounded-2xl bg-panel-2 p-4 text-sm">
        <div className="text-xs uppercase tracking-wide text-muted">{t.nav.nowAt}</div>
        <div className="mt-1 text-base">
          {p.book.name[lang]} · {parashotLabel(p, lang, t)}
          {p.standardColumn ? ` · ${t.nav.column(p.standardColumn.column)}` : ""}
        </div>
        <div className="text-muted">{versesLabel(p, t)}</div>
        <div className="mt-3">
          <Links links={linksFor(p.verses.start, p.verses.end)} compact />
        </div>
      </section>

      <section className="mt-4 flex items-center justify-between rounded-2xl bg-panel-2 px-4 py-3 text-sm">
        <span className="text-muted">{t.nav.targetIn}</span>
        <Links links={target.links} compact />
      </section>

      {footer}
      {meta && <MetaLine meta={meta} />}

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <VoiceControls available={speechAvailable()} auto={props.autoVoice} onToggleAuto={props.onToggleAutoVoice} onListen={props.onListen} />
        {here && hasNext && (
          <button type="button" onClick={onNextTarget} className="h-12 w-full rounded-xl border border-line text-sm">
            {t.nav.nextAliyah}
          </button>
        )}
        <button type="button" onClick={onAgain} className="h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
          {here ? t.nav.verifyAgain : t.nav.movedScanAgain}
        </button>
      </div>
    </main>
  );
}
