"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";

/** A number that counts up the first time it scrolls into view. Renders the final value without JS. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { tag } = useI18n();
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => new Intl.NumberFormat(tag).format(n) + suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / 1600);
          el.textContent = format(Math.round(value * (1 - Math.pow(1 - k, 4))));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    el.textContent = format(0);
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, tag, suffix]);

  return <span ref={ref}>{format(value)}</span>;
}
