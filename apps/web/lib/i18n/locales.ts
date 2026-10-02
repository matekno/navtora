/** Supported locales. Pure module shared by the proxy, the server and the client. */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Set when the user picks a language by hand; wins over Accept-Language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Hosted domains with a fixed default language, ahead of Accept-Language. */
export const HOST_LOCALE: Record<string, Locale> = {
  "navtora.vercel.app": "es",
  "navtorah.vercel.app": "en",
};

/** BCP 47 tag for dates and speech. */
export const LOCALE_TAG: Record<Locale, string> = { es: "es-AR", en: "en-US" };

/** Cookie first, then the host's language, then Accept-Language by preference, then the default. */
export function negotiateLocale(cookie: string | undefined | null, acceptLanguage: string | undefined | null, host?: string | null): Locale {
  if (hasLocale(cookie)) return cookie;
  const fromHost = host ? HOST_LOCALE[host.toLowerCase().split(":")[0] ?? ""] : undefined;
  if (fromHost) return fromHost;
  if (acceptLanguage) {
    const ranked = acceptLanguage
      .split(",")
      .map((part, i) => {
        const [tag = "", ...params] = part.trim().split(";");
        const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
        const weight = q ? Number(q.slice(2)) : 1;
        return { primary: tag.toLowerCase().split("-")[0] ?? "", weight: Number.isFinite(weight) ? weight : 0, i };
      })
      .filter((x) => x.primary && x.weight > 0)
      .sort((a, b) => b.weight - a.weight || a.i - b.i);
    for (const { primary } of ranked) if (hasLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

export function localeFromPath(pathname: string): Locale | null {
  const first = pathname.split("/")[1];
  return hasLocale(first) ? first : null;
}
