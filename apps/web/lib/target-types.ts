/** Target types shared by client and server. */
import type { NavTarget, VerseRef } from "@navtora/core";
import type { RefLinks } from "./links";

export interface TargetInfo extends NavTarget {
  id: string;
  endWord: number;
  endRef: VerseRef;
  /** 1..5 */
  book: number;
  bookName: string;
  /** short label for the camera chip */
  short: string;
  parasha?: { n: number; name: string };
  aliyah?: number | "M";
  /** reading name, when it came from the calendar */
  reading?: string;
  /** why the reading is special, e.g. the maftir of Shabbat Shekalim */
  reason?: string;
  links: RefLinks;
}

/** Annual cycle (the whole parashah every year) or triennial (a third of it each year). */
export type Cycle = "annual" | "triennial";

/** How the person's community reads, kept on the phone. */
export interface ReadingPrefs {
  il: boolean;
  cycle: Cycle;
  /** Monday and Thursday under the triennial cycle: the annual weekday reading, or the start of the coming Shabbat's */
  weekday: Cycle;
}

export interface ReadingInfo {
  name: string;
  type: string;
  summary: string;
  targets: TargetInfo[];
  /** aliyot span more than one book: probably needs a second sefer */
  multipleBooks: boolean;
  /** 1..3, when the reading follows the triennial cycle */
  triennialYear?: number;
  /** how this reading was chosen, e.g. that weekdays keep the annual cycle */
  note?: string;
}

/** Where a scan falls in this year's triennial reading. */
export interface TriennialPlacement {
  /** 1..3 */
  year: number;
  /** aliyot of this year's reading in view; none when the column is outside it */
  aliyot: Array<{ reading: string; n: number; startsHere: boolean }>;
  /** what is read this year of each parashah in view, e.g. "Bereshit 34:1 a 35:15" */
  portions: Array<{ name: string; summary: string }>;
}

/** A calendar date with a festive or special reading. */
export interface HolidayItem {
  dateISO: string;
  hebrewDate: string;
  /** hebcal reading names, e.g. "Rosh Hashana I (on Shabbat)" */
  names: string[];
  summary: string;
}

/** Scroll length in words and the first word of each book, for the scroll map. */
export interface ScrollInfo {
  totalWords: number;
  /** index 0 = Bereshit … 4 = Devarim */
  bookStarts: number[];
}

export type TargetRequest = (
  | { kind: "aliyah"; parasha: number; aliyah?: number | "M"; cycle?: Cycle; il?: boolean; /** 1..3, triennial only; defaults to this year's */ triYear?: number }
  | { kind: "verse"; book: number; chapter: number; verse: number }
  | { kind: "today"; date?: string; il?: boolean; cycle?: Cycle; weekday?: Cycle }
  | { kind: "holidays"; year?: number; il?: boolean; cycle?: Cycle; weekday?: Cycle }
) & {
  /** label language; falls back to the cookie or Accept-Language */
  lang?: string;
};

export interface TargetResponse {
  targets: TargetInfo[];
  readings?: ReadingInfo[];
  hebrewDate?: string;
  /** when the date has no reading: the next one that does */
  next?: { dateISO: string; hebrewDate: string; names: string[] } | null;
  year?: number;
  years?: number[];
  holidays?: HolidayItem[];
  /** a parashah under the triennial cycle: which year is shown, and when it is read */
  triennial?: {
    year: number;
    /** this year's number in the cycle */
    current: number;
    dateISO: string;
    hebrewDate: string;
    /** the combined reading, when that year it is read together with its neighbour */
    together: string | null;
  };
  error?: string;
}

export interface ParashaListItem {
  n: number;
  name: { en: string; he: string; es: string };
  book: number;
  aliyot: Array<number | "M">;
}
