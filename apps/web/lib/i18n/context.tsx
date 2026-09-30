"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getDictionary, type Dictionary } from "./index";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_TAG, hasLocale, type Locale } from "./locales";

interface I18n {
  lang: Locale;
  /** BCP 47 tag, for dates and speech */
  tag: string;
  t: Dictionary;
  /** Stores the choice in a cookie and reloads under the other locale. */
  switchTo: (lang: Locale) => void;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, children }: { lang: string; children: ReactNode }) {
  const value = useMemo<I18n>(() => {
    const locale: Locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
    return {
      lang: locale,
      tag: LOCALE_TAG[locale],
      t: getDictionary(locale),
      switchTo: (next) => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        window.location.assign(`/${next}`);
      },
    };
  }, [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}

/** Renders dictionary text with **bold** markers. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>))}</>;
}

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, t, switchTo } = useI18n();
  const other: Locale = lang === "es" ? "en" : "es";
  return (
    <button type="button" onClick={() => switchTo(other)} aria-label={t.app.switchLabel} lang={other} className={className}>
      {t.app.switchTo}
    </button>
  );
}
