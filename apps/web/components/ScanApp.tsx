"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocateResult, Navigation, OcrResult } from "@kore/core";
import { DEFAULT_MODEL, isOcrModel, type OcrModelId } from "@/lib/models";
import type { TargetInfo } from "@/lib/target-types";
import { Camera } from "./Camera";
import { ConsentGate } from "./ConsentGate";
import { ManualInput } from "./ManualInput";
import { NavigationCard } from "./NavigationCard";
import { ResultCard, type ScanMeta } from "./ResultCard";
import { TargetPicker } from "./TargetPicker";
import { UncertainCard } from "./UncertainCard";

const CONSENT_KEY = "kore.consent.v1";
const MODEL_KEY = "kore.model.v1";
const TARGETS_KEY = "kore.targets.v1";
const VOICE_KEY = "kore.voice.v1";
const WPC_KEY = "kore.wpc.v1";

type Screen = "consent" | "camera" | "manual" | "result" | "target";

interface Outcome {
  locate: LocateResult;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  navigation: Navigation | null;
  error: string | null;
}

interface TargetState {
  targets: TargetInfo[];
  active: number;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento */
  }
}

function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function ScanApp() {
  const [screen, setScreen] = useState<Screen>("consent");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [returnTo, setReturnTo] = useState<"camera" | "manual">("camera");
  const [model, setModel] = useState<OcrModelId>(DEFAULT_MODEL);
  const [targetState, setTargetState] = useState<TargetState>({ targets: [], active: 0 });
  const [voice, setVoice] = useState(false);
  const wpcRef = useRef<number[]>([]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CONSENT_KEY) === "1") setScreen("camera");
      const saved = window.localStorage.getItem(MODEL_KEY);
      if (isOcrModel(saved)) setModel(saved);
    } catch {
      /* sin almacenamiento: se pide consentimiento cada vez */
    }
    const t = readJson<TargetState>(TARGETS_KEY);
    if (t && Array.isArray(t.targets)) setTargetState({ targets: t.targets, active: Math.min(t.active ?? 0, Math.max(0, t.targets.length - 1)) });
    setVoice(readJson<boolean>(VOICE_KEY) === true);
    wpcRef.current = readJson<number[]>(WPC_KEY) ?? [];
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const activeTarget = targetState.targets[targetState.active] ?? null;

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

  const setTargets = useCallback((targets: TargetInfo[], active: number) => {
    const next = { targets, active };
    setTargetState(next);
    writeJson(TARGETS_KEY, next);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoice((v) => {
      writeJson(VOICE_KEY, !v);
      if (!v && outcome?.navigation) speak(outcome.navigation.instruction);
      return !v;
    });
  }, [outcome]);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      setBusy(true);
      setReturnTo("camera");
      try {
        const form = new FormData();
        form.append("image", blob, "columna.jpg");
        form.append("model", model);
        if (activeTarget) {
          form.append("target", JSON.stringify({ word: activeTarget.word, endWord: activeTarget.endWord, label: activeTarget.label, ref: activeTarget.ref }));
        }
        if (wpcRef.current.length > 0) {
          const avg = wpcRef.current.reduce((s, x) => s + x, 0) / wpcRef.current.length;
          form.append("wpc", String(Math.round(avg)));
        }
        const res = await fetch("/api/scan", { method: "POST", body: form });
        const body = (await res.json()) as { locate?: LocateResult; ocr?: OcrResult; meta?: ScanMeta; navigation?: Navigation | null; error?: string };
        if (!res.ok || !body.locate) {
          setOutcome({ locate: emptyResult(), ocr: null, meta: null, navigation: null, error: body.error ?? `Error ${res.status}` });
        } else {
          // aprender palabras por columna de este sefer cuando no es el layout estándar
          const best = body.locate.best;
          if (best && !best.standardColumn && best.layout.wordsPerColumn) {
            wpcRef.current = [...wpcRef.current.slice(-4), best.layout.wordsPerColumn];
            writeJson(WPC_KEY, wpcRef.current);
          }
          const navigation = body.navigation ?? null;
          setOutcome({ locate: body.locate, ocr: body.ocr ?? null, meta: body.meta ?? null, navigation, error: null });
          if (voice && navigation) speak(navigation.instruction);
        }
      } catch (err) {
        setOutcome({ locate: emptyResult(), ocr: null, meta: null, navigation: null, error: `No se pudo conectar con el servidor: ${(err as Error).message}` });
      } finally {
        setBusy(false);
        setScreen("result");
      }
    },
    [model, activeTarget, voice],
  );

  const handleManual = useCallback(async (text: string) => {
    setBusy(true);
    setReturnTo("manual");
    try {
      const res = await fetch("/api/locate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const body = (await res.json()) as { locate?: LocateResult; error?: string };
      if (!res.ok || !body.locate) setOutcome({ locate: emptyResult(), ocr: null, meta: null, navigation: null, error: body.error ?? `Error ${res.status}` });
      else setOutcome({ locate: body.locate, ocr: null, meta: null, navigation: null, error: null });
    } catch (err) {
      setOutcome({ locate: emptyResult(), ocr: null, meta: null, navigation: null, error: `No se pudo conectar con el servidor: ${(err as Error).message}` });
    } finally {
      setBusy(false);
      setScreen("result");
    }
  }, []);

  if (screen === "consent") return <ConsentGate onAccept={accept} />;
  if (screen === "target") return <TargetPicker onPick={(t, a) => { setTargets(t, a); setScreen("camera"); }} onCancel={() => setScreen("camera")} />;
  if (screen === "manual") return <ManualInput busy={busy} onSubmit={handleManual} onBack={() => setScreen("camera")} />;
  if (screen === "result" && outcome) {
    const best = outcome.locate.best;
    if (outcome.locate.status === "confident" && best && !outcome.error) {
      if (outcome.navigation && activeTarget) {
        return (
          <NavigationCard
            navigation={outcome.navigation}
            target={activeTarget}
            placement={best}
            meta={outcome.meta}
            hasNext={targetState.active < targetState.targets.length - 1}
            voice={voice}
            onToggleVoice={toggleVoice}
            onAgain={() => setScreen(returnTo)}
            onNextTarget={() => {
              setTargets(targetState.targets, targetState.active + 1);
              setScreen("camera");
            }}
            onChangeTarget={() => setScreen("target")}
          />
        );
      }
      return <ResultCard placement={best} ocr={outcome.ocr} meta={outcome.meta} onAgain={() => setScreen(returnTo)} onPickTarget={() => setScreen("target")} />;
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
  return (
    <Camera
      busy={busy}
      model={model}
      onModelChange={changeModel}
      onCapture={handleCapture}
      onManual={() => setScreen("manual")}
      targetLabel={activeTarget?.short ?? null}
      onPickTarget={() => setScreen("target")}
      onClearTarget={() => setTargets([], 0)}
    />
  );
}

function emptyResult(): LocateResult {
  return { status: "insufficient", best: null, alternatives: [], reasons: [], suggestions: [] };
}
