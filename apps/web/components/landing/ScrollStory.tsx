"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";

export interface StoryData {
  /** consecutive columns, ascending; lines are consonantal, `open` marks a line that ends early */
  columns: Array<{ n: number; lines: Array<{ text: string; open: boolean }> }>;
  current: number;
  target: number;
  /** 1-based line where the target reading starts */
  targetLine: number;
  currentParasha: { es: string; en: string };
  targetParasha: { es: string; en: string };
}

// Stage geometry in design pixels; the stage is scaled to fit its box. Narrow boxes get a narrower stage.
const STAGE_W = 720;
const STAGE_W_NARROW = 460;
const STAGE_H = 520;
const COL_W = 236;
const PITCH = COL_W + 34;
const PAD_TOP = 44;
const LINE_H = 23;
const FRAME_LINES = 16;
const SCAN_LINES = 10;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Story state at scroll progress p in [0, 1]. Moving goes column by column. */
function stateAt(p: number, distance: number) {
  const k = seg(p, 0.5, 0.86) * distance;
  const whole = Math.floor(k);
  const shift = whole >= distance ? distance : whole + easeInOut(k - whole);
  return {
    step: p < 0.2 ? 0 : p < 0.48 ? 1 : p < 0.88 ? 2 : 3,
    scan: seg(p, 0.2, 0.42),
    located: p >= 0.42,
    shift,
    arrive: seg(p, 0.88, 0.93),
  };
}

export function ScrollStory({ data }: { data: StoryData }) {
  const { t, lang } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const stageW = useRef(STAGE_W);
  const boxRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);

  const distance = data.current - data.target;
  const first = data.columns[0]!.n;
  const stripW = data.columns.length * PITCH - (PITCH - COL_W);
  // translateX that puts column (current - shift) under the frame; the strip runs right to left
  const xFor = (shift: number, width = stageW.current) => width / 2 - stripW + COL_W / 2 + (data.current - first - shift) * PITCH;
  const steps = t.landing.steps;

  useEffect(() => {
    const section = sectionRef.current;
    const box = boxRef.current;
    if (!section || !box) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
      const s = stateAt(p, distance);
      const style = section.style;
      style.setProperty("--p", p.toFixed(4));
      style.setProperty("--x", `${xFor(s.shift).toFixed(1)}px`);
      style.setProperty("--scan", s.scan.toFixed(4));
      style.setProperty("--arrive", s.arrive.toFixed(4));
      section.dataset.step = String(s.step);
      section.dataset.located = s.located ? "1" : "0";
      section.dataset.scanning = s.scan > 0 && s.scan < 1 ? "1" : "0";
      const left = Math.max(0, distance - Math.round(s.shift));
      if (countRef.current) countRef.current.textContent = String(left);
      if (unitRef.current) unitRef.current.textContent = t.nav.columnsUnit(left, true);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const fit = () => {
      stageW.current = box.clientWidth < 540 ? STAGE_W_NARROW : STAGE_W;
      const scale = Math.min(1, box.clientWidth / stageW.current, box.clientHeight / STAGE_H);
      box.style.setProperty("--s", scale.toFixed(4));
      section.style.setProperty("--stage-w", `${stageW.current}px`);
      update();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    fit();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [distance, t]);

  const initial = { "--p": 0, "--x": `${xFor(0, STAGE_W)}px`, "--scan": 0, "--arrive": 0, "--stage-w": `${STAGE_W}px` } as React.CSSProperties;

  return (
    <section ref={sectionRef} id="how" className="story relative h-[380svh]" data-step="0" data-located="0" data-scanning="0" style={initial}>
      <div className="sticky top-0 mx-auto flex h-svh max-w-6xl flex-col px-6 pb-6 pt-20 md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center md:gap-12 md:pb-10">
        <div className="mx-auto w-full max-w-md md:mx-0 md:max-w-none">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">{t.landing.nav.how}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">{t.landing.storyTitle}</h2>

          <div className="relative mt-6 hidden md:block">
            <div aria-hidden className="absolute bottom-2 left-[11px] top-2 w-px bg-line">
              <div className="story-progress h-full w-full bg-accent" />
            </div>
            <ol className="story-steps space-y-7">
              {steps.map((s, i) => (
                <li key={s.title} data-s={i} className="story-step relative flex gap-5">
                  <span className="story-dot mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-line bg-ink text-[11px] tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium">{s.title}</h3>
                    <p className="mt-1 max-w-sm text-[15px] leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div ref={boxRef} className="story-box relative mt-4 min-h-0 flex-1 md:mt-0 md:h-[min(72svh,560px)] md:flex-none" style={{ "--s": 0.5 } as React.CSSProperties}>
          <div
            className="story-stage absolute left-1/2 top-1/2 overflow-hidden rounded-[28px]"
            style={{ width: "var(--stage-w)", height: STAGE_H }}
            aria-hidden
          >
            <div className="story-strip parchment absolute inset-y-0 left-0 flex flex-row-reverse" style={{ width: stripW, gap: PITCH - COL_W }}>
              {data.columns.map((c) => (
                <div key={c.n} className="scroll-text relative shrink-0 text-[11px] text-[#2b2118]" style={{ width: COL_W, paddingTop: PAD_TOP }}>
                  {c.lines.map((l, i) => (
                    <div key={i} className="relative" style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}>
                      {c.n === data.current && i < SCAN_LINES && (
                        <span className="story-scan-hl absolute inset-x-[-4px] inset-y-[3px] rounded-sm bg-accent/45" style={{ "--i": i } as React.CSSProperties} />
                      )}
                      {c.n === data.target && i === data.targetLine - 1 && (
                        <span className="story-target-hl absolute inset-x-[-6px] inset-y-[2px] rounded bg-ok/40 ring-1 ring-ok" />
                      )}
                      <span className={`relative block overflow-hidden whitespace-nowrap ${l.open ? "" : "[text-align-last:justify]"}`}>{l.text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div
              className="story-frame absolute rounded-2xl border-[3px] border-accent"
              style={{ left: `calc(var(--stage-w) / 2 - ${COL_W / 2 + 18}px)`, width: COL_W + 36, top: PAD_TOP - 14, height: FRAME_LINES * LINE_H + 28 }}
            >
              <div className="story-frame-ok absolute -inset-[3px] rounded-2xl border-[3px] border-ok" />
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="story-scanline scanbar absolute inset-x-0 h-16 -translate-y-full" />
              </div>
            </div>
          </div>

          <div className="story-chip absolute left-1/2 top-2 flex max-w-[92%] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink/85 px-4 py-2 text-sm shadow-lg ring-1 ring-line backdrop-blur">
            <span className="text-muted">{t.nav.objective}</span>
            <span className="truncate font-medium text-accent">{t.aliyah.withParasha(data.targetParasha[lang], t.aliyah.label(1))}</span>
          </div>

          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <div className="story-badge absolute bottom-0 flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2 text-sm text-muted ring-1 ring-line backdrop-blur" data-b="hint">
              <span className="animate-bounce">↓</span> {t.landing.scrollHint}
            </div>
            <div className="story-badge absolute bottom-0 flex items-center gap-2 whitespace-nowrap rounded-2xl bg-ink/90 px-4 py-3 text-sm ring-1 ring-line backdrop-blur" data-b="located">
              <span className="grid size-5 place-items-center rounded-full bg-ok/20 text-xs text-ok">✓</span>
              <span className="text-muted">{t.nav.nowAt}</span>
              <span className="font-medium">
                {data.currentParasha[lang]} · {t.nav.column(data.current)}
              </span>
            </div>
            <div className="story-badge absolute bottom-0 flex items-center gap-3 whitespace-nowrap rounded-2xl bg-ink/90 px-5 py-3 ring-1 ring-line backdrop-blur" data-b="move">
              <span className="text-3xl leading-none text-accent">→</span>
              <span ref={countRef} className="text-4xl font-semibold leading-none tabular-nums">
                {distance}
              </span>
              <span className="text-left text-sm leading-tight">
                <span ref={unitRef}>{t.nav.columnsUnit(distance, true)}</span>
                <br />
                <b className="font-semibold">{t.nav.toTheRight}</b>
              </span>
            </div>
            <div className="story-badge absolute bottom-0 flex items-center gap-2 whitespace-nowrap rounded-2xl bg-ok/15 px-4 py-3 text-sm ring-1 ring-ok/50 backdrop-blur" data-b="arrived">
              <span className="font-semibold text-ok">✓ {t.nav.arrived}</span>
              <span className="text-fg">
                · {t.nav.startsAt(true)} {t.nav.lineN(data.targetLine)}
              </span>
            </div>
          </div>
        </div>

        <ol className="story-steps mt-5 min-h-[6.5rem] md:hidden">
          {steps.map((s, i) => (
            <li key={s.title} data-s={i} className="story-step mx-auto max-w-md">
              <h3 className="text-lg font-medium">
                <span className="mr-2 text-sm tabular-nums text-accent">{i + 1}</span>
                {s.title}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
