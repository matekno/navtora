"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocateResult, Navigation, OcrResult } from "@navtora/core";
import { useI18n } from "@/lib/i18n/context";
import { DEFAULT_MODEL, isOcrModel, type OcrModelId } from "@/lib/models";
import { speechForNavigation } from "@/lib/say";
import { primeSpeech, speak } from "@/lib/speech";
import type { ScrollInfo, TargetInfo } from "@/lib/target-types";
import { Camera } from "./Camera";
import { ConsentGate } from "./ConsentGate";
import { ManualInput } from "./ManualInput";
import { NavigationCard } from "./NavigationCard";
import { ResultCard, type ScanMeta } from "./ResultCard";
import { TargetPicker } from "./TargetPicker";
import { UncertainCard } from "./UncertainCard";

const KEYS = {
  consent: "navtora.consent.v1",
  model: "navtora.model.v1",
  targets: "navtora.targets.v1",
  voice: "navtora.voice.v1",
  wpc: "navtora.wpc.v1",
};

type Screen = "consent" | "camera" | "manual" | "result" | "target";

interface Outcome {
  locate: LocateResult;
  ocr: OcrResult | null;
  meta: ScanMeta | null;
  navigation: Navigation | null;
  scroll: ScrollInfo | null;
  error: string | null;
}

interface TargetState {
  targets: TargetInfo[];
  active: number;
}

interface ApiResponse {
  locate?: LocateResult;
  ocr?: OcrResult;
  meta?: ScanMeta;
  navigation?: Navigation | null;
  scroll?: ScrollInfo;
  error?: string;
}

// localStorage can be missing or throw (private mode); the app works without it
function load<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const EMPTY: LocateResult = { status: "insufficient", best: null, alternatives: [], reasons: [], suggestions: [] };

function failure(error: string): Outcome {
  return { locate: EMPTY, ocr: null, meta: null, navigation: null, scroll: null, error };
}

export function ScanApp() {
  const { t, lang, tag } = useI18n();
  const [screen, setScreen] = useState<Screen>("consent");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [returnTo, setReturnTo] = useState<"camera" | "manual">("camera");
  const [model, setModel] = useState<OcrModelId>(DEFAULT_MODEL);
  const [targetState, setTargetState] = useState<TargetState>({ targets: [], active: 0 });
  const [autoVoice, setAutoVoice] = useState(false);
  // words per column seen in this sefer, when it doesn't follow the standard layout
  const wpcRef = useRef<number[]>([]);

  useEffect(() => {
    if (load<boolean>(KEYS.consent)) setScreen("camera");
    const saved = load<string>(KEYS.model);
    if (isOcrModel(saved)) setModel(saved);
    const ts = load<TargetState>(KEYS.targets);
    if (ts && Array.isArray(ts.targets)) setTargetState({ targets: ts.targets, active: Math.min(ts.active ?? 0, Math.max(0, ts.targets.length - 1)) });
    setAutoVoice(load<boolean>(KEYS.voice) === true);
    wpcRef.current = load<number[]>(KEYS.wpc) ?? [];
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
  }, []);

  const activeTarget = targetState.targets[targetState.active] ?? null;

  const changeModel = useCallback((m: OcrModelId) => {
    setModel(m);
    save(KEYS.model, m);
  }, []);

  const accept = useCallback(() => {
    save(KEYS.consent, true);
    setScreen("camera");
  }, []);

  const setTargets = useCallback((targets: TargetInfo[], active: number) => {
    const next = { targets, active };
    setTargetState(next);
    save(KEYS.targets, next);
  }, []);

  const toggleAutoVoice = useCallback(() => {
    setAutoVoice((v) => {
      save(KEYS.voice, !v);
      return !v;
    });
  }, []);

  const sayNavigation = useCallback(
    (nav: Navigation | null) => {
      if (nav && activeTarget) void speak(speechForNavigation(nav, activeTarget.label, t, tag));
    },
    [activeTarget, t, tag],
  );

  const handleCapture = useCallback(
    async (blob: Blob) => {
      setBusy(true);
      setReturnTo("camera");
      if (autoVoice) primeSpeech();
      try {
        const form = new FormData();
        form.append("image", blob, "column.jpg");
        form.append("model", model);
        form.append("lang", lang);
        if (activeTarget) {
          const { word, endWord, label, ref } = activeTarget;
          form.append("target", JSON.stringify({ word, endWord, label, ref }));
        }
        if (wpcRef.current.length > 0) {
          const avg = wpcRef.current.reduce((s, x) => s + x, 0) / wpcRef.current.length;
          form.append("wpc", String(Math.round(avg)));
        }
        const res = await fetch("/api/scan", { method: "POST", body: form });
        const body = (await res.json()) as ApiResponse;
        if (!res.ok || !body.locate) {
          setOutcome(failure(body.error ?? t.errors.http(res.status)));
          return;
        }
        const best = body.locate.best;
        if (best && !best.standardColumn && best.layout.wordsPerColumn) {
          wpcRef.current = [...wpcRef.current.slice(-4), best.layout.wordsPerColumn];
          save(KEYS.wpc, wpcRef.current);
        }
        const navigation = body.navigation ?? null;
        setOutcome({ locate: body.locate, ocr: body.ocr ?? null, meta: body.meta ?? null, navigation, scroll: body.scroll ?? null, error: null });
        if (autoVoice) sayNavigation(navigation);
      } catch (err) {
        setOutcome(failure(t.errors.connect((err as Error).message)));
      } finally {
        setBusy(false);
        setScreen("result");
      }
    },
    [model, lang, activeTarget, autoVoice, sayNavigation, t],
  );

  const handleManual = useCallback(
    async (text: string) => {
      setBusy(true);
      setReturnTo("manual");
      try {
        const res = await fetch("/api/locate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) });
        const body = (await res.json()) as ApiResponse;
        if (!res.ok || !body.locate) setOutcome(failure(body.error ?? t.errors.http(res.status)));
        else setOutcome({ locate: body.locate, ocr: null, meta: null, navigation: null, scroll: body.scroll ?? null, error: null });
      } catch (err) {
        setOutcome(failure(t.errors.connect((err as Error).message)));
      } finally {
        setBusy(false);
        setScreen("result");
      }
    },
    [lang, t],
  );

  if (screen === "consent") return <ConsentGate onAccept={accept} />;
  if (screen === "target") {
    return (
      <TargetPicker
        onPick={(targets, active) => {
          setTargets(targets, active);
          setScreen("camera");
        }}
        onCancel={() => setScreen("camera")}
      />
    );
  }
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
            scroll={outcome.scroll}
            meta={outcome.meta}
            hasNext={targetState.active < targetState.targets.length - 1}
            autoVoice={autoVoice}
            onToggleAutoVoice={toggleAutoVoice}
            onListen={() => sayNavigation(outcome.navigation)}
            onAgain={() => setScreen(returnTo)}
            onNextTarget={() => {
              setTargets(targetState.targets, targetState.active + 1);
              setScreen("camera");
            }}
            onChangeTarget={() => setScreen("target")}
          />
        );
      }
      return (
        <ResultCard
          placement={best}
          ocr={outcome.ocr}
          meta={outcome.meta}
          scroll={outcome.scroll}
          onAgain={() => setScreen(returnTo)}
          onPickTarget={() => setScreen("target")}
        />
      );
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
