"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { canvasToJpeg, captureFrame, meanLuminance } from "@/lib/image";
import type { ReadOverlay } from "@/lib/local-ocr";
import { ScanProgress } from "./ScanProgress";

interface Props {
  busy: boolean;
  /** the lines the phone found in the photo being read */
  reading: { overlay?: ReadOverlay } | null;
  onCapture: (blob: Blob) => void;
  onManual: () => void;
  /** short label of the active target, or null when just locating */
  targetLabel: string | null;
  onPickTarget: () => void;
  onClearTarget: () => void;
}

type CamState = "starting" | "ready" | "denied" | "unavailable";

/** measured typical scan time, to pace the progress bar */
const EXPECTED_MS = 2500;

export function Camera({ busy, reading, onCapture, onManual, targetLabel, onPickTarget, onClearTarget }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>("starting");
  const [lowLight, setLowLight] = useState(false);
  const [torch, setTorch] = useState<{ supported: boolean; on: boolean }>({ supported: false, on: false });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorch({ supported: Boolean(caps.torch), on: false });
        setState("ready");
      } catch (err) {
        setState((err as DOMException)?.name === "NotAllowedError" ? "denied" : "unavailable");
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // release the frozen photo when the scan ends
  useEffect(() => {
    if (!busy && photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
      void videoRef.current?.play().catch(() => undefined);
    }
  }, [busy, photoUrl]);
  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  // local light check once a second; nothing is uploaded
  useEffect(() => {
    if (state !== "ready" || busy) return;
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      setLowLight(meanLuminance(v) < 60);
    }, 1000);
    return () => window.clearInterval(id);
  }, [state, busy]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch.on;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch((t) => ({ ...t, on: next }));
    } catch {
      setTorch({ supported: false, on: false });
    }
  }, [torch.on]);

  const capture = useCallback(async () => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;
    const canvas = captureFrame(v);
    const blob = await canvasToJpeg(canvas);
    // freeze on the photo that was sent
    v.pause();
    setPhotoUrl(URL.createObjectURL(blob));
    navigator.vibrate?.(30);
    onCapture(blob);
  }, [onCapture]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        {/* framing guide: one tall column */}
        {!busy && <div aria-hidden className="pointer-events-none absolute inset-x-[12%] inset-y-[8%] rounded-lg border-2 border-accent/70" />}

        {busy && photoUrl && (
          <ScanProgress photoUrl={photoUrl} expectedMs={EXPECTED_MS} overlay={reading?.overlay ?? null} />
        )}

        {!busy && (
          <div className="absolute left-0 right-0 top-[max(0.75rem,env(safe-area-inset-top))] flex flex-col items-center gap-2 px-4">
            {targetLabel ? (
              <div className="flex max-w-full items-center gap-1 rounded-full bg-ink/70 p-1 pl-3 backdrop-blur">
                <span className="truncate text-sm">
                  <span className="text-muted">{t.camera.targetPrefix}</span>
                  <span className="font-medium text-accent">{targetLabel}</span>
                </span>
                <button type="button" onClick={onPickTarget} className="h-8 rounded-full px-3 text-xs text-fg">
                  {t.camera.change}
                </button>
                <button type="button" onClick={onClearTarget} aria-label={t.camera.removeTarget} className="h-8 rounded-full px-3 text-xs text-muted">
                  ✕
                </button>
              </div>
            ) : (
              <button type="button" onClick={onPickTarget} className="h-9 rounded-full bg-ink/70 px-4 text-sm font-medium text-accent backdrop-blur">
                {t.camera.pickTarget}
              </button>
            )}
          </div>
        )}

        {state === "starting" && <Overlay>{t.camera.starting}</Overlay>}
        {state === "denied" && <Overlay>{t.camera.denied}</Overlay>}
        {state === "unavailable" && <Overlay>{t.camera.unavailable}</Overlay>}
        {state === "ready" && lowLight && !busy && (
          <div className="absolute left-4 right-4 top-28 rounded-xl bg-warn/90 px-4 py-3 text-center text-sm font-medium text-ink">
            {t.camera.lowLight}
          </div>
        )}
      </div>

      {!busy && (
        <div className="flex items-center justify-between gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={onManual} className="h-12 min-w-24 rounded-xl border border-line px-4 text-sm text-fg">
            {t.camera.type}
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={state !== "ready"}
            aria-label={t.camera.capture}
            className="size-20 rounded-full border-4 border-fg/90 bg-accent disabled:opacity-40 active:scale-95"
          />
          {torch.supported ? (
            <button
              type="button"
              onClick={toggleTorch}
              className={`h-12 min-w-24 rounded-xl border px-4 text-sm ${torch.on ? "border-accent bg-accent text-ink" : "border-line text-fg"}`}
            >
              {t.camera.torch}
            </button>
          ) : (
            <div className="min-w-24" />
          )}
        </div>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/70 p-8 text-center text-base leading-relaxed">
      <div>{children}</div>
    </div>
  );
}
