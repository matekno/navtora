"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  /** object URL of the captured photo, shown frozen */
  photoUrl: string;
  modelLabel: string;
  /** expected scan time, to pace the bar */
  expectedMs: number;
}

/** Waiting screen: frozen photo, a scan line sweeping it, and a progress bar paced to the expected time. */
export function ScanProgress({ photoUrl, modelLabel, expectedMs }: Props) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - t0), 100);
    return () => window.clearInterval(id);
  }, []);

  // reaches 88% at the expected time, then creeps toward 98%; never stalls, never hits 100 early
  const ratio = elapsed / expectedMs;
  const progress = ratio < 1 ? 88 * (1 - Math.pow(1 - ratio, 2)) : 88 + 10 * (1 - Math.exp(-(ratio - 1) * 1.5));
  const secs = Math.floor(elapsed / 1000);

  let stage: string;
  if (elapsed < 1500) stage = t.progress.sending;
  else if (ratio < 0.75) stage = t.progress.reading(modelLabel);
  else if (ratio < 1.4) stage = t.progress.searching;
  else stage = t.progress.slow;

  return (
    <div className="absolute inset-0 bg-ink">
      <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div aria-hidden className="pointer-events-none absolute inset-x-[12%] inset-y-[8%] overflow-hidden rounded-lg border-2 border-accent">
        <div className="scanline absolute inset-x-0 h-24" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/90 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="flex items-baseline justify-between">
          <div className="text-base font-medium" aria-live="polite">
            {stage}
          </div>
          <div className="text-sm tabular-nums text-muted">{secs} s</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted">{t.progress.note}</div>
      </div>
    </div>
  );
}
