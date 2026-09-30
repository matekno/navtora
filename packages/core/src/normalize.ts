/**
 * Normalizes Hebrew to consonantal text as written in a scroll.
 *
 * Strips nikkud, cantillation, meteg, rafe, shin/sin dots and qamats qatan.
 * Maqaf becomes a space because words joined by maqaf are written apart in the
 * sefer. Sof pasuk and paseq are dropped: they do not exist in the scroll.
 * `?` is kept as the OCR's wildcard for an illegible letter.
 */

const HEBREW_LETTER = /[א-ת]/;

// Cantillation and nikkud (0591–05BD), rafe (05BF), paseq (05C0), shin/sin dots
// (05C1, 05C2), sof pasuk (05C3), rare marks (05C4, 05C5), nun hafukha (05C6),
// qamats qatan (05C7), bidi controls and invisible characters.
const STRIP_RE = /[\u0591-\u05BD\u05BF-\u05C7\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
// maqaf and equivalent dashes
const MAQAF_RE = /[\u05BE\u2010-\u2015\-]/g;

/** Returns consonantal text with words separated by single spaces. */
export function normalizeHebrew(input: string): string {
  const stripped = input.replace(STRIP_RE, "").replace(MAQAF_RE, " ");
  let out = "";
  let pendingSpace = false;
  for (const ch of stripped) {
    if (HEBREW_LETTER.test(ch) || ch === "?") {
      if (pendingSpace && out.length > 0) out += " ";
      pendingSpace = false;
      out += ch;
    } else {
      // any other character (whitespace, punctuation, digits, Latin) is a separator
      pendingSpace = true;
    }
  }
  return out;
}

/** Normalizes and splits into words, dropping empty tokens. */
export function tokenizeHebrew(input: string): string[] {
  const n = normalizeHebrew(input);
  return n.length === 0 ? [] : n.split(" ");
}

export function hasHebrewLetter(word: string): boolean {
  return HEBREW_LETTER.test(word);
}

/** Sof pasuk: end-of-verse mark in the cantillated source text. */
export const SOF_PASUK = "\u05C3";
