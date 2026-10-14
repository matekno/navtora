"use client";

import { useState } from "react";

/**
 * A photo with what the app found drawn over it (<src>-analysis.webp); a tap
 * shows the photo alone (<src>.webp) and another brings the drawing back.
 */
export function PhotoToggle({
  src,
  width,
  height,
  labels,
  badge = true,
  imgClassName = "",
}: {
  src: string;
  width: number;
  height: number;
  /** what a tap will show: the photo alone, or the drawing again */
  labels: { photo: string; analysis: string };
  /** a small label on the image saying what a tap does; off for thin images */
  badge?: boolean;
  imgClassName?: string;
}) {
  const [plain, setPlain] = useState(false);
  const next = plain ? labels.analysis : labels.photo;
  return (
    <button type="button" onClick={() => setPlain((v) => !v)} aria-pressed={plain} aria-label={next} title={next} className="relative mx-auto block cursor-pointer overflow-hidden rounded-lg">
      <img src={`${src}-analysis.webp`} alt="" width={width} height={height} loading="lazy" className={`block ${imgClassName}`} />
      <img src={`${src}.webp`} alt="" width={width} height={height} loading="lazy" className={`absolute inset-0 size-full transition-opacity duration-300 ${plain ? "opacity-100" : "opacity-0"}`} />
      {badge && <span className="absolute end-2 bottom-2 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] text-fg">{next}</span>}
    </button>
  );
}
