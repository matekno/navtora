/** Dictionaries and locale helpers. No React, so API routes and metadata can use it too. */
import { en } from "./en";
import { es } from "./es";
import { readCookie } from "../cookies";
import { DEFAULT_LOCALE, LOCALE_COOKIE, hasLocale, negotiateLocale, type Locale } from "./locales";
import type { Dictionary } from "./types";

export type { Dictionary } from "./types";
export { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, LOCALE_TAG, hasLocale, negotiateLocale, type Locale } from "./locales";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

export function getDictionary(lang: string | null | undefined): Dictionary {
  return DICTIONARIES[hasLocale(lang) ? lang : DEFAULT_LOCALE];
}

/** Locale for an API request: explicit field, then cookie, then Accept-Language. */
export function langFromRequest(req: Request, explicit?: unknown): Locale {
  if (hasLocale(explicit)) return explicit;
  return negotiateLocale(readCookie(req, LOCALE_COOKIE), req.headers.get("accept-language"));
}
