"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  className?: string;
}

/** Muted video that plays while it is on screen, unless the visitor prefers reduced motion. */
export function AutoplayVideo({ src, poster, width, height, label, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.55 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      width={width}
      height={height}
      aria-label={label}
      muted
      loop
      playsInline
      controls
      preload="none"
      className={className}
    />
  );
}
