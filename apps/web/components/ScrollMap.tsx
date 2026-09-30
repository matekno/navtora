"use client";

import { BOOK_NAMES } from "@navtora/core";
import { useI18n } from "@/lib/i18n/context";
import type { ScrollInfo } from "@/lib/target-types";

interface Props {
  scroll: ScrollInfo;
  /** word index where the sefer is open */
  here: number;
  /** word index of the target, if any */
  target?: number | null;
}

/**
 * The whole scroll as a bar, Bereshit on the right as it is written. A dot
 * marks where it is open and a ring marks the target.
 */
export function ScrollMap({ scroll, here, target = null }: Props) {
  const { t } = useI18n();
  const total = Math.max(1, scroll.totalWords);
  const pct = (w: number) => (Math.min(Math.max(w, 0), total) / total) * 100;
  const segments = scroll.bookStarts.map((start, i) => ({ n: i + 1, start, end: scroll.bookStarts[i + 1] ?? total }));
  const hasTarget = target !== null;

  return (
    <div className="select-none" role="img" aria-label={t.result.mapTitle}>
      <div className="relative h-9">
        {segments.map((s, i) => (
          <div
            key={s.n}
            className={`absolute top-1.5 h-6 overflow-hidden ${i % 2 ? "bg-panel-2" : "bg-line"} ${i === 0 ? "rounded-r-md" : ""} ${i === segments.length - 1 ? "rounded-l-md" : ""}`}
            style={{ right: `${pct(s.start)}%`, width: `${pct(s.end) - pct(s.start)}%` }}
          >
            <span className="hebrew block truncate px-1 text-center text-[10px] leading-6 text-muted">{BOOK_NAMES[s.n]?.he}</span>
          </div>
        ))}
        {hasTarget && (
          <>
            <div
              className="absolute top-1.5 h-6 bg-accent/25"
              style={{ right: `${Math.min(pct(here), pct(target))}%`, width: `${Math.abs(pct(here) - pct(target))}%` }}
            />
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ok bg-ink"
              style={{ left: `${100 - pct(target)}%` }}
            />
          </>
        )}
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-ink" style={{ left: `${100 - pct(here)}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-muted">
        <span>← {t.nav.map.end}</span>
        <span>{t.nav.map.start} →</span>
      </div>
      <div className="mt-1 flex gap-4 text-[11px] text-muted">
        <span>
          <span className="mr-1 inline-block size-2.5 rounded-full bg-accent align-middle" />
          {t.nav.map.here}
        </span>
        {hasTarget && (
          <span>
            <span className="mr-1 inline-block size-2.5 rounded-full border-2 border-ok align-middle" />
            {t.nav.map.target}
          </span>
        )}
      </div>
    </div>
  );
}
