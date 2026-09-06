"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canvasToJpeg, captureFrame, meanLuminance } from "@/lib/image";
import { OCR_MODELS, type OcrModelId } from "@/lib/models";
import { ScanProgress } from "./ScanProgress";

interface Props {
  busy: boolean;
  model: OcrModelId;
  onModelChange: (m: OcrModelId) => void;
  onCapture: (blob: Blob) => void;
  onManual: () => void;
}

type CamState = "starting" | "ready" | "denied" | "unavailable";

/** duración típica medida por modelo, para el ritmo de la barra de progreso */
const EXPECTED_MS: Record<OcrModelId, number> = { "claude-opus-5": 15000, "claude-sonnet-5": 12000 };

export function Camera({ busy, model, onModelChange, onCapture, onManual }: Props) {
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

  // la foto congelada se libera al salir o al volver a la cámara
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

  // medición de luz cada segundo, sin subir nada
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
    // congelar: la cámara deja de actualizarse y queda la foto que se mandó
    v.pause();
    setPhotoUrl(URL.createObjectURL(blob));
    navigator.vibrate?.(30);
    onCapture(blob);
  }, [onCapture]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        {/* guía de encuadre: una columna alta */}
        {!busy && <div aria-hidden className="pointer-events-none absolute inset-x-[12%] inset-y-[8%] rounded-lg border-2 border-accent/70" />}

        {busy && photoUrl && <ScanProgress photoUrl={photoUrl} modelLabel={OCR_MODELS[model].label} expectedMs={EXPECTED_MS[model]} />}

        {/* selector de modelo, cambiable en vivo */}
        {!busy && (
          <div className="absolute left-0 right-0 top-[max(0.75rem,env(safe-area-inset-top))] flex justify-center">
            <div role="radiogroup" aria-label="Modelo de lectura" className="flex rounded-full bg-ink/70 p-1 backdrop-blur">
              {(Object.keys(OCR_MODELS) as OcrModelId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={model === id}
                  onClick={() => onModelChange(id)}
                  className={`h-9 rounded-full px-4 text-sm font-medium ${model === id ? "bg-accent text-ink" : "text-fg"}`}
                >
                  {OCR_MODELS[id].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {state === "starting" && <Overlay>Abriendo la cámara…</Overlay>}
        {state === "denied" && (
          <Overlay>
            No hay permiso para usar la cámara. Habilitalo en la configuración del navegador o usá la entrada manual.
          </Overlay>
        )}
        {state === "unavailable" && <Overlay>Este navegador no permite usar la cámara acá. Probá con Safari o Chrome, o usá la entrada manual.</Overlay>}
        {state === "ready" && lowLight && !busy && (
          <div className="absolute left-4 right-4 top-16 rounded-xl bg-warn/90 px-4 py-3 text-center text-sm font-medium text-ink">
            Hay poca luz. Acercá una lámpara o prendé la linterna del teléfono.
          </div>
        )}
      </div>

      {!busy && (
        <div className="flex items-center justify-between gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={onManual} className="h-12 min-w-24 rounded-xl border border-line px-4 text-sm text-fg">
            Tipear
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={state !== "ready"}
            aria-label="Leer la columna"
            className="size-20 rounded-full border-4 border-fg/90 bg-accent disabled:opacity-40 active:scale-95"
          />
          {torch.supported ? (
            <button
              type="button"
              onClick={toggleTorch}
              className={`h-12 min-w-24 rounded-xl border px-4 text-sm ${torch.on ? "border-accent bg-accent text-ink" : "border-line text-fg"}`}
            >
              Linterna
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
