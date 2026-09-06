/**
 * Resolución de objetivos a índices de palabra: parashá y aliá, pasuk puntual,
 * o la lectura del día según el calendario. Sólo servidor: usa hebcal y los datos.
 */
import "server-only";
import { HDate } from "@hebcal/core";
import { getLeyningOnDate } from "@hebcal/leyning";
import { BOOK_NAMES, type ParashotData, type VerseRef } from "@kore/core";
import { aliyahLabel } from "./format";
import { linksFor } from "./links";
import { getLocator, getParashot } from "./locator";
import type { ParashaListItem, ReadingInfo, TargetInfo, TargetRequest, TargetResponse } from "./target-types";

const BOOK_BY_EN: Record<string, number> = { Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5 };

function parseCv(cv: string): { chapter: number; verse: number } {
  const [c, v] = cv.split(":").map(Number);
  return { chapter: c ?? 1, verse: v ?? 1 };
}

function makeTarget(id: string, label: string, short: string, start: VerseRef, end: VerseRef, extra: Partial<TargetInfo> = {}): TargetInfo | null {
  const text = getLocator().text;
  const word = text.startOfVerse(start);
  const endWord = text.endOfVerse(end);
  if (word < 0 || endWord < 0) return null;
  return {
    id,
    label,
    short,
    word,
    endWord,
    ref: start,
    endRef: end,
    book: start.book,
    bookName: BOOK_NAMES[start.book]?.es ?? String(start.book),
    links: linksFor(start, end),
    ...extra,
  };
}

export function listParashot(): ParashaListItem[] {
  return getParashot().map((p) => ({ n: p.n, name: p.name, book: p.book, aliyot: p.aliyot.map((a) => a.n) }));
}

function aliyahTargets(parashot: ParashotData, parashaN: number, which?: number | "M"): TargetInfo[] {
  const p = parashot.find((x) => x.n === parashaN);
  if (!p) return [];
  const list = which === undefined ? p.aliyot : p.aliyot.filter((a) => a.n === which);
  return list
    .map((a) =>
      makeTarget(`aliyah-${p.n}-${a.n}`, `${p.name.es}, ${aliyahLabel(a.n)}`, `${p.name.es} · ${a.n === "M" ? "maftir" : `${a.n}ª`}`, a.start, a.end, {
        parasha: { n: p.n, name: p.name.es },
        aliyah: a.n,
      }),
    )
    .filter((t): t is TargetInfo => t !== null);
}

function verseTarget(ref: VerseRef): TargetInfo | null {
  const bookName = BOOK_NAMES[ref.book]?.es ?? String(ref.book);
  const label = `${bookName} ${ref.chapter}:${ref.verse}`;
  return makeTarget(`verse-${ref.book}-${ref.chapter}-${ref.verse}`, label, label, ref, ref);
}

interface HebcalAliyah {
  k: string;
  b: string;
  e: string;
  v?: number;
  p?: number;
}

function todayReadings(dateISO: string | undefined, il: boolean): { readings: ReadingInfo[]; hebrewDate: string } {
  const date = dateISO ? new Date(`${dateISO}T12:00:00`) : new Date();
  const hd = new HDate(date);
  const raw = getLeyningOnDate(hd, il, true);
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const readings: ReadingInfo[] = [];
  for (const item of list) {
    // hebcal devuelve Leyning o LeyningWeekday; acá alcanza con los campos comunes
    const ley = item as unknown as {
      name: { en: string };
      type: string;
      summary: string;
      fullkriyah?: Record<string, HebcalAliyah>;
      weekday?: Record<string, HebcalAliyah>;
    };
    const aliyot = ley.fullkriyah ?? ley.weekday ?? {};
    const targets: TargetInfo[] = [];
    const books = new Set<number>();
    for (const [key, a] of Object.entries(aliyot)) {
      const book = BOOK_BY_EN[a.k];
      if (!book) continue; // lecturas fuera de la Torá, por ejemplo la haftará
      const start: VerseRef = { book, ...parseCv(a.b) };
      const end: VerseRef = { book, ...parseCv(a.e) };
      const n: number | "M" = key === "M" ? "M" : Number(key);
      const t = makeTarget(`today-${ley.name.en}-${key}`, `${ley.name.en}, ${aliyahLabel(n)}`, `${ley.name.en} · ${n === "M" ? "maftir" : `${n}ª`}`, start, end, {
        aliyah: n,
        reading: ley.name.en,
        ...(a.p ? { parasha: { n: a.p, name: getParashot()[a.p - 1]?.name.es ?? String(a.p) } } : {}),
      });
      if (t) {
        targets.push(t);
        books.add(book);
      }
    }
    readings.push({ name: ley.name.en, type: ley.type, summary: ley.summary, targets, multipleBooks: books.size > 1 });
  }
  return { readings, hebrewDate: hd.render("he") };
}

export function resolveTargets(req: TargetRequest): TargetResponse {
  const parashot = getParashot();
  if (req.kind === "aliyah") {
    const targets = aliyahTargets(parashot, req.parasha, req.aliyah);
    return targets.length ? { targets } : { targets: [], error: "No encontré esa parashá o aliá." };
  }
  if (req.kind === "verse") {
    const t = verseTarget({ book: req.book, chapter: req.chapter, verse: req.verse });
    return t ? { targets: [t] } : { targets: [], error: "Ese versículo no existe en la Torá." };
  }
  const { readings, hebrewDate } = todayReadings(req.date, req.il ?? false);
  return { targets: readings.flatMap((r) => r.targets), readings, hebrewDate };
}
