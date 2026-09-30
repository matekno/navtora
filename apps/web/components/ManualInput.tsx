"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  busy: boolean;
  onSubmit: (text: string) => void;
  onBack: () => void;
}

export function ManualInput({ busy, onSubmit, onBack }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <h1 className="text-xl font-semibold">{t.manual.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.manual.help}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir="rtl"
        lang="he"
        rows={5}
        autoFocus
        spellCheck={false}
        placeholder="ויאמר אלהם יוסף הוא אשר"
        className="hebrew mt-4 w-full rounded-2xl border border-line bg-panel p-4 text-2xl leading-relaxed outline-none focus:border-accent"
      />
      <div className="mt-2 text-right text-xs text-muted">{t.manual.wordCount(words)}</div>
      <div className="mt-auto flex gap-3 pt-6">
        <button type="button" onClick={onBack} className="h-14 flex-1 rounded-2xl border border-line text-base">
          {t.manual.camera}
        </button>
        <button
          type="button"
          disabled={busy || words < 4}
          onClick={() => onSubmit(text)}
          className="h-14 flex-[2] rounded-2xl bg-accent text-lg font-semibold text-ink disabled:opacity-40 active:scale-[0.99]"
        >
          {busy ? t.manual.searching : t.manual.locate}
        </button>
      </div>
    </main>
  );
}
