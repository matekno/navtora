/**
 * Resolves navigation targets to word indexes: a parashah and aliyah, a verse,
 * the reading for a date, or the year's holidays and special days.
 *
 * hebcal handles the year-to-year variants: Rosh Hashanah on Shabbat with seven
 * aliyot, chol hamoed by weekday, special Shabbatot with a maftir from a second
 * sefer, fast days with a mincha reading.
 */
import "server-only";
import { HDate, HebrewCalendar } from "@hebcal/core";
import { getLeyningOnDate } from "@hebcal/leyning";
import { BOOK_NAMES, type ParashotData, type VerseRef } from "@navtora/core";
import { getDictionary, type Dictionary, type Locale } from "./i18n";
import { linksFor } from "./links";
import { getLocator, getParashot } from "./locator";
import type { HolidayItem, ParashaListItem, ReadingInfo, TargetInfo, TargetRequest, TargetResponse } from "./target-types";

const BOOK_BY_EN: Record<string, number> = { Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5 };

function parseCv(cv: string): { chapter: number; verse: number } {
  const [c, v] = cv.split(":").map(Number);
  return { chapter: c ?? 1, verse: v ?? 1 };
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bookName(book: number, lang: Locale): string {
  return BOOK_NAMES[book]?.[lang] ?? String(book);
}

function makeTarget(id: string, label: string, short: string, start: VerseRef, end: VerseRef, lang: Locale, extra: Partial<TargetInfo> = {}): TargetInfo | null {
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
    bookName: bookName(start.book, lang),
    links: linksFor(start, end),
    ...extra,
  };
}

export function listParashot(): ParashaListItem[] {
  return getParashot().map((p) => ({ n: p.n, name: p.name, book: p.book, aliyot: p.aliyot.map((a) => a.n) }));
}

function aliyahTargets(parashot: ParashotData, parashaN: number, which: number | "M" | undefined, t: Dictionary): TargetInfo[] {
  const p = parashot.find((x) => x.n === parashaN);
  if (!p) return [];
  const list = which === undefined ? p.aliyot : p.aliyot.filter((a) => a.n === which);
  const name = p.name[t.lang];
  return list
    .map((a) =>
      makeTarget(`aliyah-${p.n}-${a.n}`, t.aliyah.withParasha(name, t.aliyah.label(a.n)), `${name} · ${t.aliyah.short(a.n)}`, a.start, a.end, t.lang, {
        parasha: { n: p.n, name },
        aliyah: a.n,
      }),
    )
    .filter((x): x is TargetInfo => x !== null);
}

function verseTarget(ref: VerseRef, lang: Locale): TargetInfo | null {
  const label = `${bookName(ref.book, lang)} ${ref.chapter}:${ref.verse}`;
  return makeTarget(`verse-${ref.book}-${ref.chapter}-${ref.verse}`, label, label, ref, ref, lang);
}

interface HebcalAliyah {
  k: string;
  b: string;
  e: string;
  v?: number;
  p?: number;
  reason?: string;
}

interface HebcalReading {
  name: { en: string };
  type: string;
  summary: string;
  fullkriyah?: Record<string, HebcalAliyah>;
  weekday?: Record<string, HebcalAliyah>;
}

function hebcalReadings(hd: HDate, il: boolean): HebcalReading[] {
  const raw = getLeyningOnDate(hd, il, true);
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list as unknown as HebcalReading[];
}

/** All Torah readings on a date, with aliyot resolved to word indexes. */
function readingsForDate(hd: HDate, il: boolean, t: Dictionary): ReadingInfo[] {
  const readings: ReadingInfo[] = [];
  for (const ley of hebcalReadings(hd, il)) {
    const aliyot = ley.fullkriyah ?? ley.weekday ?? {};
    const targets: TargetInfo[] = [];
    const books = new Set<number>();
    for (const [key, a] of Object.entries(aliyot)) {
      const book = BOOK_BY_EN[a.k];
      if (!book) continue; // outside the Torah, e.g. the haftarah
      const start: VerseRef = { book, ...parseCv(a.b) };
      const end: VerseRef = { book, ...parseCv(a.e) };
      const n: number | "M" = key === "M" ? "M" : Number(key);
      const target = makeTarget(
        `${isoDate(hd.greg())}-${ley.name.en}-${key}`,
        t.aliyah.withParasha(ley.name.en, t.aliyah.label(n)),
        `${ley.name.en} · ${t.aliyah.short(n)}`,
        start,
        end,
        t.lang,
        {
          aliyah: n,
          reading: ley.name.en,
          ...(a.reason ? { reason: a.reason } : {}),
          ...(a.p ? { parasha: { n: a.p, name: getParashot()[a.p - 1]?.name[t.lang] ?? String(a.p) } } : {}),
        },
      );
      if (target) {
        targets.push(target);
        books.add(book);
      }
    }
    if (targets.length === 0) continue;
    readings.push({ name: ley.name.en, type: ley.type, summary: ley.summary, targets, multipleBooks: books.size > 1 });
  }
  return readings;
}

/** Next date with a reading, looking up to 10 days ahead. */
function nextReading(from: HDate, il: boolean, t: Dictionary): TargetResponse["next"] {
  for (let i = 1; i <= 10; i++) {
    const hd = from.add(i, "d");
    const readings = readingsForDate(hd, il, t);
    if (readings.length > 0) {
      return { dateISO: isoDate(hd.greg()), hebrewDate: hd.render("he"), names: readings.map((r) => r.name) };
    }
  }
  return null;
}

/** Dates in a Hebrew year with a festive or special reading. */
function holidaysForYear(year: number, il: boolean): HolidayItem[] {
  const events = HebrewCalendar.calendar({ year, isHebrewYear: true, il, noModern: true, sedrot: false, candlelighting: false });
  const days = new Map<string, HDate>();
  for (const ev of events) days.set(ev.getDate().toString(), ev.getDate());
  const items: HolidayItem[] = [];
  for (const hd of days.values()) {
    const readings = hebcalReadings(hd, il).filter((l) => {
      if (l.type === "weekday") return false;
      // a regular Shabbat only counts if it has a special maftir
      if (l.type === "shabbat") return Boolean(l.fullkriyah?.M?.reason);
      return true;
    });
    if (readings.length === 0) continue;
    items.push({
      dateISO: isoDate(hd.greg()),
      hebrewDate: hd.render("he"),
      names: [...new Set(readings.map((r) => r.name.en))],
      summary: readings.map((r) => r.summary).join(" · "),
    });
  }
  items.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return items;
}

export function resolveTargets(req: TargetRequest, lang: Locale): TargetResponse {
  const t = getDictionary(lang);
  const parashot = getParashot();
  if (req.kind === "aliyah") {
    const targets = aliyahTargets(parashot, req.parasha, req.aliyah, t);
    return targets.length ? { targets } : { targets: [], error: t.api.aliyahNotFound };
  }
  if (req.kind === "verse") {
    const target = verseTarget({ book: req.book, chapter: req.chapter, verse: req.verse }, lang);
    return target ? { targets: [target] } : { targets: [], error: t.api.verseNotFound };
  }
  if (req.kind === "holidays") {
    const il = req.il ?? false;
    const now = new HDate();
    const current = now.getFullYear();
    // during Elul people are preparing for Rosh Hashanah, so default to next year
    const defaultYear = now.getMonth() === 6 ? current + 1 : current;
    const year = req.year ?? defaultYear;
    return { targets: [], year, years: [current - 1, current, current + 1, current + 2], holidays: holidaysForYear(year, il) };
  }
  const il = req.il ?? false;
  const date = req.date ? new Date(`${req.date}T12:00:00`) : new Date();
  const hd = new HDate(date);
  const readings = readingsForDate(hd, il, t);
  return {
    targets: readings.flatMap((r) => r.targets),
    readings,
    hebrewDate: hd.render("he"),
    next: readings.length === 0 ? nextReading(hd, il, t) : null,
  };
}
