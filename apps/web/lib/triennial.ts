/**
 * The triennial cycle, from @hebcal/triennial: each parashah is split in
 * three and one third is read each year, in seven short aliyot. It is the
 * system of the Rabbinical Assembly's CJLS (Eisenberg, 1988, with the 2012
 * and 2020 changes), counted from 5744.
 *
 * Only Shabbat with a parashah changes; holidays keep their readings. On
 * Monday and Thursday there are two customs (Dorff, "Annual and Triennial
 * Systems for Reading the Torah", CJLS 1987): keep the annual weekday reading,
 * or read the start of what will be read on Shabbat, at least ten verses in
 * three aliyot. For the second one NavTorah takes the first three aliyot of
 * the coming Shabbat and adds the next one to the third while they come to
 * fewer than ten verses, as Marsh suggests ("The Sequential Triennial Cycle",
 * AJR, 2015).
 */
import "server-only";
import { HDate, HebrewCalendar, flags, months, parshiot, type Event, type ParshaEvent } from "@hebcal/core";
import { getTriennial, getTriennialForParshaHaShavua, Triennial } from "@hebcal/triennial";
import { BOOK_NAMES, type VerseRef } from "@navtora/core";
import type { Dictionary, Locale } from "./i18n";
import { getLocator, getParashot } from "./locator";
import type { TriennialPlacement } from "./target-types";

/** An aliyah as hebcal gives it: book name in English and chapter:verse. */
export interface HebcalAliyah {
  k: string;
  b: string;
  e: string;
  v?: number;
  p?: number;
  reason?: string;
}

export type HebcalAliyot = Record<string, HebcalAliyah>;

const BOOK_BY_EN: Record<string, number> = { Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5 };

function parseCv(cv: string): { chapter: number; verse: number } {
  const [c, v] = cv.split(":").map(Number);
  return { chapter: c ?? 1, verse: v ?? 1 };
}

/** Start and end verse of an aliyah, or null outside the Torah (a haftarah). */
export function aliyahRefs(a: HebcalAliyah): { start: VerseRef; end: VerseRef } | null {
  const book = BOOK_BY_EN[a.k];
  if (!book) return null;
  return { start: { book, ...parseCv(a.b) }, end: { book, ...parseCv(a.e) } };
}

/** Position of a verse in the Torah, counting from 0. */
function verseIndex(ref: VerseRef): number {
  return getLocator().text.verses.findIndex((x) => x.book === ref.book && x.chapter === ref.chapter && x.verse === ref.verse);
}

/** First and last verse of an aliyah as positions in the Torah, or null. */
function verseSpan(a: HebcalAliyah): [number, number] | null {
  const refs = aliyahRefs(a);
  if (!refs) return null;
  const s = verseIndex(refs.start);
  const e = verseIndex(refs.end);
  return s >= 0 && e >= s ? [s, e] : null;
}

/** Year 1, 2 or 3 of the cycle for a Hebrew year. */
export function cycleYear(hebrewYear: number): number {
  return Triennial.getYearNumber(hebrewYear);
}

/**
 * Hebrew year whose readings are under way. The year's readings go from
 * Bereshit to Simchat Torah, so between Rosh Hashanah and Simchat Torah the
 * previous year is still being read.
 */
export function readingYear(hd: HDate, il: boolean): number {
  const year = hd.getFullYear();
  const simchatTorah = new HDate(il ? 22 : 23, months.TISHREI, year);
  return hd.abs() < simchatTorah.abs() ? year - 1 : year;
}

function isParshaEvent(ev: Event): ev is ParshaEvent {
  return (ev.getFlags() & flags.PARSHA_HASHAVUA) !== 0;
}

/** The weekly parashah read on a Shabbat, or the first one after `from` within four weeks. */
function parshaEvent(from: HDate, il: boolean, after: boolean): ParshaEvent | null {
  const start = after ? from.add(1, "d") : from;
  const end = after ? from.add(28, "d") : from;
  const events = HebrewCalendar.calendar({ start, end, sedrot: true, noHolidays: true, il });
  return events.find(isParshaEvent) ?? null;
}

export interface TriennialShabbat {
  /** 1..3 */
  year: number;
  aliyot: HebcalAliyot;
}

/** The triennial reading of a Shabbat with a parashah, special maftir included; null on other days. */
export function shabbatReading(hd: HDate, il: boolean): TriennialShabbat | null {
  const ev = parshaEvent(hd, il, false);
  if (!ev) return null;
  const r = getTriennialForParshaHaShavua(ev, il);
  if (!r.aliyot) return null;
  return { year: (r.yearNum ?? 0) + 1, aliyot: r.aliyot as HebcalAliyot };
}

const WEEKDAY_MIN_VERSES = 10;

/**
 * Monday or Thursday by the triennial cycle: the first three aliyot of the
 * coming Shabbat's reading, adding the next aliyah to the third while they
 * come to fewer than ten verses. `parsha` is the parashah hebcal gives for
 * the weekday; null when the next Shabbat with a parashah reads another one,
 * as with Vezot Haberakhah between Yom Kippur and Sukkot.
 */
export function weekdayReading(hd: HDate, il: boolean, parsha: string[]): TriennialShabbat | null {
  const ev = parshaEvent(hd, il, true);
  if (!ev || ev.p.parsha.join("-") !== parsha.join("-")) return null;
  const shabbat = getTriennialForParshaHaShavua(ev, il);
  const all = shabbat.aliyot as HebcalAliyot | undefined;
  const first = [all?.["1"], all?.["2"], all?.["3"]];
  if (!all || first.some((a) => !a)) return null;
  const parts = first.map((a) => ({ ...a! }));
  const spans = parts.map(verseSpan);
  if (spans.some((s) => s === null)) return null;
  let total = spans.reduce((sum, s) => sum + (s![1] - s![0] + 1), 0);
  let lastEnd = spans[2]![1];
  for (let k = 4; total < WEEKDAY_MIN_VERSES && k <= 7; k++) {
    const next = all[String(k)];
    const span = next ? verseSpan(next) : null;
    // only an aliyah that goes straight on, so nothing is skipped
    if (!next || !span || span[0] !== lastEnd + 1 || next.k !== parts[2]!.k) break;
    parts[2]!.e = next.e;
    total += span[1] - span[0] + 1;
    lastEnd = span[1];
  }
  for (const p of parts) {
    delete p.v;
    delete p.reason;
  }
  return { year: (shabbat.yearNum ?? 0) + 1, aliyot: { "1": parts[0]!, "2": parts[1]!, "3": parts[2]! } };
}

export interface TriennialParashaReading {
  /** 1..3 */
  year: number;
  /** the parashot read: one, or two when they are read together that year */
  parashot: number[];
  /** the Shabbat it is read */
  date: HDate;
  aliyot: HebcalAliyot;
}

/**
 * The reading of parashah `n` (1..54) in year `year` (1..3) of the cycle that
 * Hebrew year `around` belongs to. When that year it is read together with its
 * neighbour, the reading is the combined one.
 */
export function parashaReading(n: number, year: number, around: number, il: boolean): TriennialParashaReading | null {
  const name = parshiot[n - 1];
  if (!name || year < 1 || year > 3) return null;
  const tri = getTriennial(around, il);
  let r = tri.getReading(name, year - 1);
  let parashot = [n];
  if (r.readTogether) {
    parashot = r.readTogether.startsWith(`${name}-`) ? [n, n + 1] : [n - 1, n];
    r = tri.getReading(r.readTogether, year - 1);
  }
  if (!r.aliyot || !r.date) return null;
  return { year, parashot, date: r.date, aliyot: r.aliyot as HebcalAliyot };
}

/** "Vayakhel-Pekudei", in the app's language. */
export function readingName(parashot: number[], lang: Locale): string {
  const list = getParashot();
  return parashot.map((n) => list[n - 1]?.name[lang] ?? String(n)).join("-");
}

/** "Bereshit 34:1 a 35:15", merging aliyot that follow one another; the maftir only when it is read elsewhere. */
export function readingSummary(aliyot: HebcalAliyot, t: Dictionary): string {
  const ranges: Array<{ span: [number, number]; refs: { start: VerseRef; end: VerseRef } }> = [];
  for (const key of ["1", "2", "3", "4", "5", "6", "7", "M"]) {
    const a = aliyot[key];
    const span = a ? verseSpan(a) : null;
    const refs = a ? aliyahRefs(a) : null;
    if (!span || !refs) continue;
    const last = ranges[ranges.length - 1];
    if (key === "M" && ranges.some((r) => span[0] >= r.span[0] && span[1] <= r.span[1])) continue;
    if (last && span[0] === last.span[1] + 1) {
      last.span = [last.span[0], span[1]];
      last.refs = { start: last.refs.start, end: refs.end };
    } else {
      ranges.push({ span, refs });
    }
  }
  return ranges
    .map(({ refs: { start: s, end: e } }) => t.format.verseRange(BOOK_NAMES[s.book]?.[t.lang] ?? String(s.book), s.chapter, s.verse, e.chapter, e.verse))
    .join("; ");
}

/**
 * Which aliyot of this year's triennial reading a scanned span falls in, for
 * the parashot it shows. No aliyot means the column is outside what is read
 * this year.
 */
export function triennialPlacement(
  span: { startWord: number; endWord: number },
  parashot: number[],
  il: boolean,
  t: Dictionary,
  now: Date = new Date(),
): TriennialPlacement | null {
  const around = readingYear(new HDate(now), il);
  const year = cycleYear(around);
  const text = getLocator().text;
  const seen = new Set<string>();
  const result: TriennialPlacement = { year, aliyot: [], portions: [] };
  for (const n of parashot) {
    const reading = parashaReading(n, year, around, il);
    if (!reading) continue;
    const key = reading.parashot.join("-");
    if (seen.has(key)) continue;
    seen.add(key);
    const name = readingName(reading.parashot, t.lang);
    result.portions.push({ name, summary: readingSummary(reading.aliyot, t) });
    for (const [k, a] of Object.entries(reading.aliyot)) {
      if (k === "M") continue; // it repeats the end of the seventh, or comes from elsewhere
      const refs = aliyahRefs(a);
      if (!refs) continue;
      const start = text.startOfVerse(refs.start);
      const end = text.endOfVerse(refs.end);
      if (start < 0 || end < 0 || start > span.endWord || end < span.startWord) continue;
      result.aliyot.push({ reading: name, n: Number(k), startsHere: start >= span.startWord && start <= span.endWord });
    }
  }
  return result.portions.length > 0 ? result : null;
}
