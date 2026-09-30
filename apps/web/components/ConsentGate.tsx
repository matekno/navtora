"use client";

import { LanguageSwitch, Rich, useI18n } from "@/lib/i18n/context";

export function ConsentGate({ onAccept }: { onAccept: () => void }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">{t.app.name}</h1>
          <LanguageSwitch className="h-9 shrink-0 rounded-full border border-line px-3 text-sm text-muted" />
        </div>
        <p className="mt-2 text-muted">{t.app.tagline}</p>

        <h2 className="mt-10 text-lg font-medium">{t.consent.heading}</h2>
        <ul className="mt-4 space-y-4 text-[15px] leading-relaxed">
          {t.consent.bullets.map((text, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
              <span>
                <Rich text={text} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={onAccept} className="mt-10 h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-ink active:scale-[0.99]">
        {t.consent.accept}
      </button>
    </main>
  );
}
