"use client";

import { useI18n } from "@/lib/i18n/context";

interface Props {
  available: boolean;
  /** read each result as soon as it arrives */
  auto: boolean;
  onToggleAuto: () => void;
  onListen: () => void;
}

export function VoiceControls({ available, auto, onToggleAuto, onListen }: Props) {
  const { t } = useI18n();
  if (!available) return null;
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onListen} className="h-12 flex-1 rounded-xl border border-line text-sm text-fg active:bg-panel-2">
        🔊 {t.voice.listen}
      </button>
      <button
        type="button"
        onClick={onToggleAuto}
        aria-pressed={auto}
        title={t.voice.auto}
        className={`h-12 rounded-xl border px-4 text-sm ${auto ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
      >
        {t.voice.autoShort}
      </button>
    </div>
  );
}
