/** Labels derived from a placement, in the app's language. Pure: client and server. */
import type { Placement } from "@navtora/core";
import type { Dictionary, Locale } from "./i18n";

/** "Bereshit 41:1-39" */
export function versesLabel(p: Placement, t: Dictionary): string {
  const s = p.verses.start;
  const e = p.verses.end;
  return t.format.verseRange(p.book.name[t.lang], s.chapter, s.verse, e.chapter, e.verse);
}

/** "third aliyah", or "seventh aliyah of Miketz and first aliyah of Vayigash" across two parashot */
export function aliyotLabel(p: Placement, t: Dictionary): string {
  if (p.aliyot.length === 0) return t.aliyah.none;
  const byParasha = new Map<string, Array<number | "M">>();
  for (const a of p.aliyot) {
    const key = a.parashaName[t.lang];
    byParasha.set(key, [...(byParasha.get(key) ?? []), a.n]);
  }
  return [...byParasha.entries()]
    .map(([parasha, ns]) => {
      const text = t.format.list(ns.map(t.aliyah.label));
      return byParasha.size > 1 ? t.aliyah.ofParasha(text, parasha) : text;
    })
    .join("; ");
}

/** "Miketz and Vayigash" */
export function parashotLabel(p: Placement, lang: Locale, t: Dictionary): string {
  return t.format.list(p.parashot.map((x) => x.name[lang]));
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
