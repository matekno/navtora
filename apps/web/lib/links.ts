/** Links a Sefaria y tikkun.io para cualquier referencia. Puro, se usa en cliente y servidor. */
import type { VerseRef } from "@kore/core";

const SEFARIA_BOOKS: Record<number, string> = { 1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy" };

/** Sefaria, texto bilingüe. Con `end` arma un rango. */
export function sefariaUrl(start: VerseRef, end?: VerseRef): string {
  const book = SEFARIA_BOOKS[start.book] ?? "Genesis";
  let ref = `${book}.${start.chapter}.${start.verse}`;
  if (end && (end.chapter !== start.chapter || end.verse !== start.verse)) {
    ref += end.chapter === start.chapter ? `-${end.verse}` : `-${end.chapter}.${end.verse}`;
  }
  return `https://www.sefaria.org/${ref}?lang=bi`;
}

/** tikkun.io abre el rollo en el versículo indicado, con el texto tal como está escrito en el sefer. */
export function tikkunUrl(ref: VerseRef): string {
  return `https://tikkun.io/#/r/${ref.book}-${ref.chapter}-${ref.verse}`;
}

export interface RefLinks {
  sefaria: string;
  tikkun: string;
}

export function linksFor(start: VerseRef, end?: VerseRef): RefLinks {
  return { sefaria: sefariaUrl(start, end), tikkun: tikkunUrl(start) };
}
