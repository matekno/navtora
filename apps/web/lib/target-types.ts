/** Tipos de objetivo compartidos entre cliente y servidor. */
import type { NavTarget, VerseRef } from "@kore/core";
import type { RefLinks } from "./links";

export interface TargetInfo extends NavTarget {
  id: string;
  endWord: number;
  endRef: VerseRef;
  /** 1..5 */
  book: number;
  bookName: string;
  /** texto corto para el chip de la cámara */
  short: string;
  parasha?: { n: number; name: string };
  aliyah?: number | "M";
  /** nombre de la lectura del día a la que pertenece, si vino del calendario */
  reading?: string;
  links: RefLinks;
}

export interface ReadingInfo {
  name: string;
  type: string;
  summary: string;
  targets: TargetInfo[];
  /** hay aliot en más de un libro: probablemente hace falta otro sefer */
  multipleBooks: boolean;
}

export type TargetRequest =
  | { kind: "aliyah"; parasha: number; aliyah?: number | "M" }
  | { kind: "verse"; book: number; chapter: number; verse: number }
  | { kind: "today"; date?: string; il?: boolean };

export interface TargetResponse {
  targets: TargetInfo[];
  readings?: ReadingInfo[];
  hebrewDate?: string;
  error?: string;
}

export interface ParashaListItem {
  n: number;
  name: { en: string; he: string; es: string };
  book: number;
  aliyot: Array<number | "M">;
}
