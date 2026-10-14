/**
 * Dedications: someone sponsors a week or a jag, and the app shows their name
 * and dedication during it. A week runs from Sunday to Shabbat and is named by
 * that Shabbat's parashah; a jag is shown from the week before it until its
 * last day. The admin adds them by hand after the person gets in touch.
 *
 * Dates are local days (YYYY-MM-DD) in the server's time zone. The calendar is
 * the Diaspora one.
 */
import "server-only";
import { getSedra, HDate, months } from "@hebcal/core";
import { getDb } from "./db";
import { getDictionary, type Locale } from "./i18n";
import { getParashot } from "./locator";
import { localDay } from "./stats";
import type { DedicationView } from "./support-types";

export type DedicationKind = "week" | "jag" | "custom";

export const JAGUIM = [
  { id: "rosh-hashanah", month: months.TISHREI, day: 1, days: 2 },
  { id: "yom-kippur", month: months.TISHREI, day: 10, days: 1 },
  // Sukkot through Shemini Atzeret and Simchat Torah
  { id: "sukkot", month: months.TISHREI, day: 15, days: 9 },
  { id: "chanukah", month: months.KISLEV, day: 25, days: 8 },
  { id: "purim", month: months.ADAR_II, day: 14, days: 1 },
  { id: "pesach", month: months.NISAN, day: 15, days: 8 },
  { id: "shavuot", month: months.SIVAN, day: 6, days: 2 },
] as const;

export type JagId = (typeof JAGUIM)[number]["id"];

/** Days before a jag when its dedication starts showing. */
const JAG_LEAD_DAYS = 7;

export interface Period {
  kind: Exclude<DedicationKind, "custom">;
  /** the Shabbat's date for a week, `<jag>-<hebrew year>` for a jag */
  key: string;
  start: string;
  end: string;
  label: string;
}

function dayOf(d: Date): string {
  return localDay(d);
}

function parseDay(day: string): Date {
  return new Date(`${day}T12:00:00`);
}

function shift(day: string, n: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return dayOf(d);
}

/** First and last day of a jag in a Hebrew year. */
function jagDays(jag: (typeof JAGUIM)[number], year: number): { first: HDate; last: HDate } {
  // Purim is in Adar II only in a leap year
  const month = jag.month === months.ADAR_II && !HDate.isLeapYear(year) ? months.ADAR_I : jag.month;
  const first = new HDate(jag.day, month, year);
  return { first, last: first.add(jag.days - 1, "d") };
}

/** Name of the parashah read on a Shabbat, or of the holiday when it replaces it. */
export function parashaOfShabbat(shabbat: Date, lang: Locale): string {
  const hd = new HDate(shabbat);
  const res = getSedra(hd.getFullYear(), false).lookup(hd);
  if (res.chag) {
    const jag = JAGUIM.find((j) => {
      const { first, last } = jagDays(j, hd.getFullYear());
      return hd.abs() >= first.abs() && hd.abs() <= last.abs();
    });
    return jag ? getDictionary(lang).dedication.jag(jag.id) : (res.parsha[0] ?? "");
  }
  const nums = Array.isArray(res.num) ? res.num : [res.num];
  const parashot = getParashot();
  return nums.map((n) => parashot[n - 1]?.name[lang] ?? res.parsha[0] ?? String(n)).join("-");
}

/** The week of a Shabbat (YYYY-MM-DD), or null if the date isn't a Saturday. */
export function weekPeriod(shabbatDay: string, lang: Locale): Period | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(shabbatDay)) return null;
  const shabbat = parseDay(shabbatDay);
  if (Number.isNaN(shabbat.getTime()) || shabbat.getDay() !== 6 || dayOf(shabbat) !== shabbatDay) return null;
  const t = getDictionary(lang);
  return { kind: "week", key: shabbatDay, start: shift(shabbatDay, -6), end: shabbatDay, label: t.dedication.week(parashaOfShabbat(shabbat, lang)) };
}

/** The weeks of the next `count` Shabbatot, starting with the current week. */
export function upcomingWeeks(lang: Locale, count: number, from: Date = new Date()): Period[] {
  const today = dayOf(from);
  const shabbat = shift(today, 6 - parseDay(today).getDay());
  const out: Period[] = [];
  for (let i = 0; i < count; i++) {
    const p = weekPeriod(shift(shabbat, 7 * i), lang);
    if (p) out.push(p);
  }
  return out;
}

/** A jag in a Hebrew year: from a week before its first day to its last day. */
export function jagPeriod(key: string, lang: Locale): Period | null {
  const m = /^([a-z-]+)-(\d{4})$/.exec(key);
  if (!m) return null;
  const jag = JAGUIM.find((j) => j.id === m[1]);
  const year = Number(m[2]);
  if (!jag || year < 5700 || year > 6000) return null;
  const { first, last } = jagDays(jag, year);
  const t = getDictionary(lang);
  return { kind: "jag", key, start: shift(dayOf(first.greg()), -JAG_LEAD_DAYS), end: dayOf(last.greg()), label: t.dedication.jag(jag.id) };
}

/** Jaguim whose display period hasn't ended and starts within `days` days. */
export function upcomingJaguim(lang: Locale, days = 400, from: Date = new Date()): Period[] {
  const today = dayOf(from);
  const until = shift(today, days);
  const year = new HDate(from).getFullYear();
  const out: Period[] = [];
  for (const y of [year, year + 1, year + 2]) {
    for (const j of JAGUIM) {
      const p = jagPeriod(`${j.id}-${y}`, lang);
      if (p && p.end >= today && p.start <= until) out.push(p);
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

export function periodFor(kind: string, key: string, lang: Locale): Period | null {
  if (kind === "week") return weekPeriod(key, lang);
  if (kind === "jag") return jagPeriod(key, lang);
  return null;
}

// ---- storage ----

export interface DedicationRow {
  id: number;
  created: string;
  kind: DedicationKind;
  key: string | null;
  start_day: string;
  end_day: string;
  name: string;
  message: string | null;
}

function labelFor(row: DedicationRow, lang: Locale): string {
  if (row.kind !== "custom" && row.key) {
    const p = periodFor(row.kind, row.key, lang);
    if (p) return p.label;
  }
  return getDictionary(lang).dedication.custom;
}

export function toView(row: DedicationRow, lang: Locale): DedicationView {
  return { id: row.id, kind: row.kind, label: labelFor(row, lang), name: row.name, message: row.message, start: row.start_day, end: row.end_day };
}

/** Dedications showing on a day, jaguim first. */
export function activeDedications(lang: Locale, now: Date = new Date()): DedicationView[] {
  const db = getDb();
  if (!db) return [];
  try {
    const today = dayOf(now);
    const rows = db
      .prepare("SELECT * FROM dedications WHERE start_day <= ? AND end_day >= ? ORDER BY kind = 'jag' DESC, start_day, id")
      .all(today, today) as unknown as DedicationRow[];
    return rows.map((r) => toView(r, lang));
  } catch (err) {
    console.error(JSON.stringify({ evt: "db_error", what: "dedications", message: (err as Error).message }));
    return [];
  }
}

/** Current and future dedications, then the most recent past ones. */
export function listDedications(now: Date = new Date(), past = 10): { upcoming: DedicationRow[]; past: DedicationRow[] } {
  const db = getDb();
  if (!db) return { upcoming: [], past: [] };
  const today = dayOf(now);
  return {
    upcoming: db.prepare("SELECT * FROM dedications WHERE end_day >= ? ORDER BY start_day, id").all(today) as unknown as DedicationRow[],
    past: db.prepare("SELECT * FROM dedications WHERE end_day < ? ORDER BY end_day DESC, id DESC LIMIT ?").all(today, past) as unknown as DedicationRow[],
  };
}

export interface NewDedication {
  kind: DedicationKind;
  key: string | null;
  start: string;
  end: string;
  name: string;
  message: string | null;
}

export function addDedication(d: NewDedication, now: Date = new Date()): number | null {
  const db = getDb();
  if (!db) return null;
  const res = db
    .prepare("INSERT INTO dedications (created, kind, key, start_day, end_day, name, message) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(now.toISOString(), d.kind, d.key, d.start, d.end, d.name, d.message);
  return Number(res.lastInsertRowid);
}

export function deleteDedication(id: number): boolean {
  const db = getDb();
  if (!db) return false;
  return Number(db.prepare("DELETE FROM dedications WHERE id = ?").run(id).changes) > 0;
}
