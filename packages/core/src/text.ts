import type { TorahData, VerseRef } from "./types";

export const BOOK_NAMES: Record<number, { en: string; he: string; es: string }> = {
  1: { en: "Genesis", he: "בראשית", es: "Bereshit" },
  2: { en: "Exodus", he: "שמות", es: "Shemot" },
  3: { en: "Leviticus", he: "ויקרא", es: "Vaikrá" },
  4: { en: "Numbers", he: "במדבר", es: "Bamidbar" },
  5: { en: "Deuteronomy", he: "דברים", es: "Devarim" },
};

/** Indexed access to the consonantal Torah text. */
export class TorahText {
  readonly words: readonly string[];
  readonly wordVerse: readonly number[];
  readonly verses: TorahData["verses"];
  readonly petuchaBefore: ReadonlySet<number>;
  readonly gapBefore: ReadonlySet<number>;

  constructor(data: TorahData) {
    this.words = data.words;
    this.wordVerse = data.wordVerse;
    this.verses = data.verses;
    this.petuchaBefore = new Set(data.petuchaBefore);
    this.gapBefore = new Set(data.gapBefore);
    if (this.words.length !== this.wordVerse.length) {
      throw new Error(`Inconsistent TorahData: ${this.words.length} words but ${this.wordVerse.length} verse references`);
    }
  }

  get length(): number {
    return this.words.length;
  }

  refOf(wordIndex: number): VerseRef {
    const v = this.verses[this.wordVerse[wordIndex] ?? -1];
    if (!v) throw new RangeError(`Word index out of range: ${wordIndex}`);
    return { book: v.book, chapter: v.chapter, verse: v.verse };
  }

  bookOf(wordIndex: number): number {
    return this.refOf(wordIndex).book;
  }

  /** Words [start, end] inclusive, joined by spaces. */
  slice(start: number, end: number): string {
    const a = Math.max(0, start);
    const b = Math.min(this.words.length - 1, end);
    return this.words.slice(a, b + 1).join(" ");
  }

  /** First word index of a verse, or -1 if it does not exist. */
  startOfVerse(ref: VerseRef): number {
    const v = this.verses.find((x) => x.book === ref.book && x.chapter === ref.chapter && x.verse === ref.verse);
    return v ? v.start : -1;
  }

  /** Last word index of a verse, or -1 if it does not exist. */
  endOfVerse(ref: VerseRef): number {
    const i = this.verses.findIndex((x) => x.book === ref.book && x.chapter === ref.chapter && x.verse === ref.verse);
    if (i < 0) return -1;
    const next = this.verses[i + 1];
    return next ? next.start - 1 : this.words.length - 1;
  }
}

export function formatRef(ref: VerseRef, lang: "es" | "en" | "he" = "es"): string {
  const name = BOOK_NAMES[ref.book]?.[lang] ?? String(ref.book);
  return `${name} ${ref.chapter}:${ref.verse}`;
}
