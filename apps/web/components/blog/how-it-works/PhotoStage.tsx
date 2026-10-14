"use client";

import { useState } from "react";
import { edgesAt, FIG, fmtPoints, KIND_COLOR, lineWords, lineYAt, linePoints, wordSpans } from "@/lib/blog/how-it-works";

/** what is drawn over the photo; "none" hides it */
export type StageStep = "photo" | "ink" | "column" | "lines" | "crops" | "read" | "match" | "none";

export interface StageLabels {
  photo: string;
  ink: string;
  compare: string;
  /** one line under the photo per step, saying what is drawn */
  captions: Record<Exclude<StageStep, "none">, string>;
}

const W = FIG.width;
const H = FIG.height;
const IMG = "/blog/how-it-works";

/** The column's outline: left edge top to bottom, then the right edge back up. */
function columnPolygon(): string {
  const ys = [0, ...FIG.edges.map((e) => e.y), H];
  const left = ys.map((y) => [edgesAt(y)[0], y] as [number, number]);
  const right = ys.map((y) => [edgesAt(y)[1], y] as [number, number]).reverse();
  return fmtPoints([...left, ...right]);
}

/** The edge of strip k (0..K) as a path down the photo. */
function stripEdge(k: number, K: number): string {
  const ys = [0, ...FIG.edges.map((e) => e.y), H];
  return fmtPoints(ys.map((y) => {
    const [a, b] = edgesAt(y);
    return [a + (k / K) * (b - a), y] as [number, number];
  }));
}

function ColumnLayer() {
  const n = FIG.profile.length;
  const base = H - 4;
  const top = 120;
  const pts: Array<[number, number]> = FIG.profile.map((p, i) => [((i + 0.5) * W) / n, base - p * top]);
  const area = `M0,${base} L${fmtPoints(pts).replace(/ /g, " L")} L${W},${base} Z`;
  return (
    <g>
      <path d={`M0,0 H${W} V${H} H0 Z M${columnPolygon().replace(/ /g, " L")} Z`} fill="rgb(11 12 16 / 0.55)" fillRule="evenodd" />
      <polygon points={columnPolygon()} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={0} y={base - top - 10} width={W} height={top + 14} fill="rgb(11 12 16 / 0.72)" />
      <path d={area} fill="rgb(245 196 81 / 0.28)" stroke="var(--color-accent)" strokeWidth={1.5} />
      {[0, 1].map((side) => {
        const x = edgesAt(H)[side]!;
        return <line key={side} x1={x} x2={x} y1={base - top - 10} y2={base} stroke="var(--color-accent)" strokeDasharray="4 3" strokeWidth={1.5} />;
      })}
    </g>
  );
}

function LinesLayer() {
  const K = FIG.strips.x.length - 1;
  const [left, right] = FIG.strips.side;
  const graph = (s: NonNullable<typeof left>, dir: -1 | 1) => {
    const x = dir < 0 ? s.x0 : s.x1;
    const pts: Array<[number, number]> = [];
    for (let y = 0; y < s.profile.length; y += 2) pts.push([x + dir * (6 + s.profile[y]! * 44), y]);
    return pts;
  };
  return (
    <g>
      {Array.from({ length: K - 1 }, (_, i) => (
        <polyline key={i} points={stripEdge(i + 1, K)} fill="none" stroke="rgb(242 242 239 / 0.55)" strokeWidth={1} strokeDasharray="5 4" />
      ))}
      {left && right && (
        <>
          <rect x={0} y={0} width={left.x0} height={H} fill="rgb(11 12 16 / 0.7)" />
          <rect x={right.x1} y={0} width={W - right.x1} height={H} fill="rgb(11 12 16 / 0.7)" />
          <polyline points={fmtPoints(graph(left, -1))} fill="none" stroke="var(--color-ok)" strokeWidth={1.4} />
          <polyline points={fmtPoints(graph(right, 1))} fill="none" stroke="var(--color-ok)" strokeWidth={1.4} />
        </>
      )}
      {FIG.lines.map((l, i) => (
        <polyline
          key={i}
          points={fmtPoints(linePoints(l))}
          pathLength={1}
          className="overlay-line"
          style={{ animationDelay: `${i * 35}ms` }}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function CropsLayer() {
  const half = FIG.band / 2;
  return (
    <g>
      {FIG.lines.map((l, i) => {
        const band = [...linePoints(l, -half), ...linePoints(l, half).reverse()];
        return <polygon key={i} points={fmtPoints(band)} fill="rgb(245 196 81 / 0.16)" stroke="rgb(245 196 81 / 0.75)" strokeWidth={1} />;
      })}
    </g>
  );
}

/** Each line covered by what the network read there, stretched to the line's width and tilted like it. */
function ReadLayer() {
  const words = lineWords();
  const h = FIG.band * 0.92;
  return (
    <g>
      <rect width={W} height={H} fill="rgb(11 12 16 / 0.35)" />
      {FIG.lines.map((l, i) => {
        const ya = lineYAt(l, l.x0);
        const yb = lineYAt(l, l.x1);
        const cx = (l.x0 + l.x1) / 2;
        const cy = (ya + yb) / 2;
        const len = Math.hypot(l.x1 - l.x0, yb - ya);
        const angle = (Math.atan2(yb - ya, l.x1 - l.x0) * 180) / Math.PI;
        const ws = words[i] ?? [];
        return (
          <g key={i} transform={`rotate(${angle.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})`}>
            <rect x={cx - len / 2 - 3} y={cy - h / 2} width={len + 6} height={h} rx={3} fill="rgb(11 12 16 / 0.88)" />
            <text
              x={cx}
              y={cy}
              dominantBaseline="central"
              textAnchor="middle"
              direction="rtl"
              textLength={Math.max(10, len - 8)}
              lengthAdjust="spacingAndGlyphs"
              fontSize={h * 0.72}
              className="scroll-text"
              fill="var(--color-fg)"
            >
              {ws.map((w, j) => (
                <tspan key={j}>
                  {w.read.split(/(\?+)/).map((part, k) =>
                    part.startsWith("?") ? (
                      <tspan key={k} fill="var(--color-warn)">
                        {part}
                      </tspan>
                    ) : (
                      part
                    ),
                  )}
                  {j < ws.length - 1 ? " " : ""}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Each word read, painted over the ink where the network read it, in the color of how it compares to the scroll. */
function MatchLayer() {
  const words = lineWords();
  const half = (FIG.band * 0.8) / 2;
  return (
    <g>
      <rect width={W} height={H} fill="rgb(11 12 16 / 0.3)" />
      {FIG.lines.map((l, i) =>
        wordSpans(l).map(([a, b], j) => {
          const kind = words[i]?.[j]?.kind ?? null;
          // a small gap between neighboring words
          const x0 = a + 1.5;
          const x1 = Math.max(x0 + 2, b - 1.5);
          const box = [...linePoints(l, -half, 6, x0, x1), ...linePoints(l, half, 6, x0, x1).reverse()];
          return kind ? (
            <polygon key={`${i}-${j}`} points={fmtPoints(box)} fill={KIND_COLOR[kind]} fillOpacity={0.38} stroke={KIND_COLOR[kind]} strokeWidth={1.2} strokeLinejoin="round" />
          ) : (
            <polygon key={`${i}-${j}`} points={fmtPoints(box)} fill="none" stroke="rgb(242 242 239 / 0.45)" strokeWidth={1} strokeDasharray="3 3" />
          );
        }),
      )}
    </g>
  );
}

/** The photo with what one step of the reader found drawn over it. */
export function PhotoStage({ step, labels, className = "" }: { step: StageStep; labels: StageLabels; className?: string }) {
  const [split, setSplit] = useState(50);
  return (
    <figure className={className}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_30px_90px_-30px_rgb(0_0_0/0.9)]" style={{ aspectRatio: `${W} / ${H}` }}>
        <img src={`${IMG}/photo.webp`} alt="" width={W} height={H} className="absolute inset-0 size-full" />
        <img
          src={`${IMG}/ink.webp`}
          alt=""
          width={W}
          height={H}
          className="absolute inset-0 size-full transition-opacity duration-500"
          style={{ opacity: step === "ink" ? 1 : 0, clipPath: `inset(0 0 0 ${split}%)` }}
        />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
          {step === "column" && <ColumnLayer />}
          {step === "lines" && <LinesLayer key="lines" />}
          {step === "crops" && <CropsLayer />}
          {step === "read" && <ReadLayer />}
          {step === "match" && <MatchLayer />}
        </svg>
        {step === "ink" && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_12px_rgb(245_196_81/0.8)]" style={{ left: `${split}%` }}>
              <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-sm font-bold text-ink">⇆</span>
            </div>
            <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-fg">{labels.photo}</span>
            <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-fg">{labels.ink}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              aria-label={labels.compare}
              className="absolute inset-0 size-full cursor-ew-resize opacity-0"
            />
          </>
        )}
      </div>
      {step !== "none" && <figcaption className="mt-3 text-sm leading-relaxed text-muted">{labels.captions[step]}</figcaption>}
    </figure>
  );
}
