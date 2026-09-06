"use client";

import { useCallback, useEffect, useState } from "react";
import type { LocateResult, OcrResult } from "@kore/core";
import { DEFAULT_MODEL, isOcrModel, type OcrModelId } from "@/lib/models";
import { Camera } from "./Camera";
import { ConsentGate } from "./ConsentGate";
import { ManualInput } from "./ManualInput";
import { ResultCard, type ScanMeta } from "./ResultCard";
import { UncertainCard } from "./UncertainCard";

const CONSENT_KEY = "kore.consent.v1";
const MODEL_KEY = "kore.model.v1";

type Screen = "consent" | "camera" | "manual" | "result";

interface Outcome {
  locate: LocateResult;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  error: string | null;
}

export function ScanApp() {
  const [screen, setScreen] = useState<Screen>("consent");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [returnTo, setReturnTo] = useState<"camera" | "manual">("camera");
  const [model, setModel] = useState<OcrModelId>(DEFAULT_MODEL);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CONSENT_KEY) === "1") setScreen("camera");
      const saved = window.localStorage.getItem(MODEL_KEY);
      if (isOcrModel(saved)) setModel(saved);
    } catch {
      /* sin almacenamiento: se pide consentimiento cada vez */
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const changeModel = useCallback((m: OcrModelId) => {
    setModel(m);
    try {
      window.localStorage.setItem(MODEL_KEY, m);
    } catch {
      /* ignorar */
    }
  }, []);

  const accept = useCallback(() => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* ignorar */
    }
    setScreen("camera");
  }, []);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      setBusy(true);
      setReturnTo("camera");
      try {
        const form = new FormData();
        form.append("image", blob, "columna.jpg");
        form.append("model", model);
        const res = await fetch("/api/scan", { method: "POST", body: form });
        const body = (await res.json()) as { locate?: LocateResult; ocr?: OcrResult; meta?: ScanMeta; error?: string };
        if (!res.ok || !body.locate) {
          setOutcome({ locate: emptyResult(), ocr: null, meta: null, error: body.error ?? `Error ${res.status}` });
        } else {
          setOutcome({ locate: body.locate, ocr: body.ocr ?? null, meta: body.meta ?? null, error: null });
        }
      } catch (err) {
        setOutcome({ locate: emptyResult(), ocr: null, meta: null, error: `No se pudo conectar con el servidor: ${(err as Error).message}` });
      } finally {
        setBusy(false);
        setScreen("result");
      }
    },
    [model],
  );

  const handleManual = useCallback(async (text: string) => {
    setBusy(true);
    setReturnTo("manual");
    try {
      const res = await fetch("/api/locate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const body = (await res.json()) as { locate?: LocateResult; error?: string };
      if (!res.ok || !body.locate) setOutcome({ locate: emptyResult(), ocr: null, meta: null, error: body.error ?? `Error ${res.status}` });
      else setOutcome({ locate: body.locate, ocr: null, meta: null, error: null });
    } catch (err) {
      setOutcome({ locate: emptyResult(), ocr: null, meta: null, error: `No se pudo conectar con el servidor: ${(err as Error).message}` });
    } finally {
      setBusy(false);
      setScreen("result");
    }
  }, []);

  if (screen === "consent") return <ConsentGate onAccept={accept} />;
  if (screen === "manual") return <ManualInput busy={busy} onSubmit={handleManual} onBack={() => setScreen("camera")} />;
  if (screen === "result" && outcome) {
    if (outcome.locate.status === "confident" && outcome.locate.best && !outcome.error) {
      return <ResultCard placement={outcome.locate.best} ocr={outcome.ocr} meta={outcome.meta} onAgain={() => setScreen(returnTo)} />;
    }
    return (
      <UncertainCard
        result={outcome.locate}
        ocr={outcome.ocr}
        meta={outcome.meta}
        error={outcome.error}
        onAgain={() => setScreen(returnTo)}
        onManual={() => setScreen("manual")}
      />
    );
  }
  return <Camera busy={busy} model={model} onModelChange={changeModel} onCapture={handleCapture} onManual={() => setScreen("manual")} />;
}

function emptyResult(): LocateResult {
  return { status: "insufficient", best: null, alternatives: [], reasons: [], suggestions: [] };
}
