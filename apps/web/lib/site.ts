/** The site's public address, for canonical links, the sitemap and link previews. */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { LOCALES, type Locale } from "@/lib/i18n";

/**
 * SITE_URL (e.g. https://navtorah.com), else the production domain on Vercel. Static pages read it
 * at build time, so Docker passes it as a build argument too.
 */
export function siteUrl(): URL | undefined {
  const raw = process.env.SITE_URL?.trim() || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

/** siteUrl's origin, or else the host the request came in on, with the scheme the reverse proxy forwards. */
export async function requestOrigin(): Promise<string> {
  const site = siteUrl();
  if (site) return site.origin;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Canonical and hreflang links for `path` under each language. Left out without a known address,
 * since Next would make them point at localhost. x-default is the bare path, which proxy.ts
 * redirects by the browser's language.
 */
export function alternates(lang: Locale, path = ""): Metadata["alternates"] {
  if (!siteUrl()) return undefined;
  return {
    canonical: `/${lang}${path}`,
    languages: { ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])), "x-default": path || "/" },
  };
}
