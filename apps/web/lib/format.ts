/** Labels derived from a placement, in the app's language. Pure: client and server. */
import type { Placement } from "@navtora/core";
import type { Dictionary, Locale } from "./i18n";
import type { TriennialPlacement } from "./target-types";

/** "Bereshit 41:1-39" */
export function versesLabel(p: Placement, t: Dictionary): string {
  const s = p.verses.start;
  const e = p.verses.end;
  return t.format.verseRange(p.book.name[t.lang], s.chapter, s.verse, e.chapter, e.verse);
}

/** "third aliyah", or "seventh aliyah of Miketz and first aliyah of Vayigash" across two parashot */
export function aliyotLabel(p: Placement, t: Dictionary): string {
  if (p.aliyot.length === 0) return t.aliyah.none;
  return groupedAliyot(
    p.aliyot.map((a) => ({ group: a.parashaName[t.lang], n: a.n })),
    t,
  );
}

/** The same, by this year's triennial reading. */
export function triennialAliyotLabel(tp: TriennialPlacement, t: Dictionary): string {
  return groupedAliyot(
    tp.aliyot.map((a) => ({ group: a.reading, n: a.n })),
    t,
  );
}

function groupedAliyot(items: Array<{ group: string; n: number | "M" }>, t: Dictionary): string {
  const byGroup = new Map<string, Array<number | "M">>();
  for (const a of items) byGroup.set(a.group, [...(byGroup.get(a.group) ?? []), a.n]);
  return [...byGroup.entries()]
    .map(([group, ns]) => {
      const text = t.format.list(ns.map(t.aliyah.label));
      return byGroup.size > 1 ? t.aliyah.ofParasha(text, group) : text;
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
