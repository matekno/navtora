"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhotoStage, type StageLabels, type StageStep } from "./PhotoStage";

/**
 * The story told over one photo. On wide screens the photo stays put while the
 * text scrolls, and it shows whatever the step being read is about; on phones
 * each step carries its own copy of the photo.
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
            className="border-t border-line/50 py-12 first:border-t-0 first:pt-4 md:min-h-[75vh] md:py-16"
          >
            <PhotoStage step={s.stage} labels={labels} className="mx-auto mb-8 max-w-[340px] md:hidden" />
            {s.content}
          </section>
        ))}
      </div>
      <div className="hidden md:block">
        <div className="sticky top-20 pt-4">
          <PhotoStage step={steps[active]?.stage ?? "photo"} labels={labels} />
        </div>
      </div>
    </div>
  );
}
