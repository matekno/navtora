/**
 * Resolución de objetivos a índices de palabra: parashá y aliá, pasuk puntual,
 * la lectura de una fecha, o el listado de jaguim y fechas especiales de un año.
 * Sólo servidor: usa hebcal y los datos.
 *
 * hebcal ya contempla las variantes por año: Rosh Hashaná en shabat con siete
 * aliot en vez de cinco, jol hamoed según el día de la semana, shabatot
 * especiales con maftir de un segundo sefer, ayunos con lectura de minjá.
 */
import "server-only";
import { HDate, HebrewCalendar } from "@hebcal/core";
import { getLeyningOnDate } from "@hebcal/leyning";
import { BOOK_NAMES, type ParashotData, type VerseRef } from "@kore/core";
import { aliyahLabel } from "./format";
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

/** Todas las lecturas de la Torá de una fecha, con sus aliot resueltas a palabras. */
function readingsForDate(hd: HDate, il: boolean): ReadingInfo[] {
  const readings: ReadingInfo[] = [];
  for (const ley of hebcalReadings(hd, il)) {
    const aliyot = ley.fullkriyah ?? ley.weekday ?? {};
    const targets: TargetInfo[] = [];
    const books = new Set<number>();
    for (const [key, a] of Object.entries(aliyot)) {
      const book = BOOK_BY_EN[a.k];
      if (!book) continue; // lecturas fuera de la Torá, por ejemplo la haftará
      const start: VerseRef = { book, ...parseCv(a.b) };
      const end: VerseRef = { book, ...parseCv(a.e) };
      const n: number | "M" = key === "M" ? "M" : Number(key);
      const t = makeTarget(`${isoDate(hd.greg())}-${ley.name.en}-${key}`, `${ley.name.en}, ${aliyahLabel(n)}`, `${ley.name.en} · ${n === "M" ? "maftir" : `${n}ª`}`, start, end, {
        aliyah: n,
        reading: ley.name.en,
        ...(a.reason ? { reason: a.reason } : {}),
        ...(a.p ? { parasha: { n: a.p, name: getParashot()[a.p - 1]?.name.es ?? String(a.p) } } : {}),
      });
      if (t) {
        targets.push(t);
        books.add(book);
      }
    }
    if (targets.length === 0) continue;
    readings.push({ name: ley.name.en, type: ley.type, summary: ley.summary, targets, multipleBooks: books.size > 1 });
  }
  return readings;
}

/** Próxima fecha con lectura a partir del día siguiente, hasta 10 días. */
function nextReading(from: HDate, il: boolean): TargetResponse["next"] {
  for (let i = 1; i <= 10; i++) {
    const hd = from.add(i, "d");
    const readings = readingsForDate(hd, il);
    if (readings.length > 0) {
      return { dateISO: isoDate(hd.greg()), hebrewDate: hd.render("he"), names: readings.map((r) => r.name) };
    }
  }
  return null;
}

/** Fechas del año hebreo con lectura festiva o especial: jaguim, jol hamoed, ayunos, rosh jodesh, shabatot especiales. */
function holidaysForYear(year: number, il: boolean): HolidayItem[] {
  const events = HebrewCalendar.calendar({ year, isHebrewYear: true, il, noModern: true, sedrot: false, candlelighting: false });
  const byDate = new Map<string, { hd: HDate; events: string[] }>();
  for (const ev of events) {
    const hd = ev.getDate();
    const key = hd.toString();
    const entry = byDate.get(key) ?? { hd, events: [] };
    const name = ev.render("es");
    if (!entry.events.includes(name)) entry.events.push(name);
    byDate.set(key, entry);
  }
  const items: HolidayItem[] = [];
  for (const { hd, events: names } of byDate.values()) {
    const readings = hebcalReadings(hd, il).filter((l) => {
      if (l.type === "weekday") return false;
      // un shabat común sólo cuenta si tiene maftir especial de otro sefer
      if (l.type === "shabbat") return Boolean(l.fullkriyah?.M?.reason);
      return true;
    });
    if (readings.length === 0) continue;
    items.push({
      dateISO: isoDate(hd.greg()),
      hebrewDate: hd.render("he"),
      names: [...new Set(readings.map((r) => r.name.en))],
      events: names,
      summary: readings.map((r) => r.summary).join(" · "),
    });
  }
  items.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return items;
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
  if (req.kind === "holidays") {
    const il = req.il ?? false;
    const now = new HDate();
    const current = now.getFullYear();
    // en Elul ya se prepara el año que viene: Rosh Hashaná está a días
    const defaultYear = now.getMonth() === 6 ? current + 1 : current;
    const year = req.year ?? defaultYear;
    return { targets: [], year, years: [current - 1, current, current + 1, current + 2], holidays: holidaysForYear(year, il) };
  }
  const il = req.il ?? false;
  const date = req.date ? new Date(`${req.date}T12:00:00`) : new Date();
  const hd = new HDate(date);
  const readings = readingsForDate(hd, il);
  return {
    targets: readings.flatMap((r) => r.targets),
    readings,
    hebrewDate: hd.render("he"),
    next: readings.length === 0 ? nextReading(hd, il) : null,
  };
}
