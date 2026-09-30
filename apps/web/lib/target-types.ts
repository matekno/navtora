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

export interface ReadingInfo {
  name: string;
  type: string;
  summary: string;
  targets: TargetInfo[];
  /** aliyot span more than one book: probably needs a second sefer */
  multipleBooks: boolean;
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
  | { kind: "aliyah"; parasha: number; aliyah?: number | "M" }
  | { kind: "verse"; book: number; chapter: number; verse: number }
  | { kind: "today"; date?: string; il?: boolean }
  | { kind: "holidays"; year?: number; il?: boolean }
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
  error?: string;
}

export interface ParashaListItem {
  n: number;
  name: { en: string; he: string; es: string };
  book: number;
  aliyot: Array<number | "M">;
}
