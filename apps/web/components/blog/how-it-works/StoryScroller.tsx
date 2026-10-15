"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhotoStage, type StageLabels, type StageStep } from "./PhotoStage";

/**
 * The story told over one photo. On wide screens the photo stays put while the
 * text scrolls, and it shows whatever the step being read is about; on phones
 * each step that changes what is drawn carries its own copy of the photo.
 */
export function StoryScroller({ steps, labels }: { steps: Array<{ stage: StageStep; content: ReactNode }>; labels: StageLabels }) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const visible = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(Number((e.target as HTMLElement).dataset.i), e.isIntersecting ? e.intersectionRatio : 0);
        // the step nearest the top of those crossing the middle band of the screen
        const on = [...visible.entries()].filter(([, r]) => r > 0).map(([i]) => i);
        if (on.length > 0) setActive(Math.min(...on));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01, 1] },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  const stage = steps[active]?.stage ?? "photo";
  // while a step without a photo is active, the last photo fades out in place
  const shown = steps.slice(0, active + 1).findLast((s) => s.stage !== "none")?.stage ?? "photo";

  return (
    <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] md:gap-12 lg:gap-16">
      <div>
        {steps.map((s, i) => (
          <section
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            data-stage={s.stage}
            className="border-t border-line/50 py-12 first:border-t-0 first:pt-4 md:min-h-[75vh] md:py-16"
          >
            {s.stage !== "none" && s.stage !== steps[i - 1]?.stage && <PhotoStage step={s.stage} labels={labels} className="mx-auto mb-8 max-w-[340px] md:hidden" />}
            {s.content}
          </section>
        ))}
      </div>
      <div className="hidden md:block">
        <div className={`sticky top-20 pt-4 transition-opacity duration-500 ${stage === "none" ? "opacity-0" : ""}`} aria-hidden={stage === "none"}>
          <PhotoStage step={shown} labels={labels} />
        </div>
      </div>
    </div>
  );
}
