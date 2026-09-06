/**
 * Normalización de hebreo al texto consonántico tal como está escrito en un rollo.
 *
 * Se quitan nikud, taamim, meteg, rafe, puntos de shin/sin y qamats qatan.
 * El maqaf pasa a espacio porque en el sefer las palabras unidas por maqaf se
 * escriben separadas. El sof pasuk y el paseq se eliminan: no existen en el rollo.
 * El signo `?` se conserva como comodín de letra ilegible que puede venir del OCR.
 */

const HEBREW_LETTER = /[א-ת]/;

// Marcas a eliminar: taamim y nikud (0591–05BD), rafe (05BF), paseq (05C0),
// puntos de shin/sin (05C1, 05C2), sof pasuk (05C3), marcas raras (05C4, 05C5),
// nun hafukha (05C6), qamats qatan (05C7), controles bidi e invisibles.
const STRIP_RE = /[\u0591-\u05BD\u05BF-\u05C7\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
// maqaf y guiones equivalentes pasan a espacio
const MAQAF_RE = /[\u05BE\u2010-\u2015\-]/g;

/** Devuelve el texto consonántico con palabras separadas por un espacio simple. */
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
      // cualquier otro carácter, incluidos espacios, puntuación, dígitos o latinas, actúa como separador
      pendingSpace = true;
    }
  }
  return out;
}

/** Normaliza y parte en palabras. Descarta tokens vacíos. */
export function tokenizeHebrew(input: string): string[] {
  const n = normalizeHebrew(input);
  return n.length === 0 ? [] : n.split(" ");
}

/** Verdadero si la palabra contiene al menos una letra hebrea. */
export function hasHebrewLetter(word: string): boolean {
  return HEBREW_LETTER.test(word);
}

/** Sof pasuk: fin de versículo en el texto fuente con taamim. */
export const SOF_PASUK = "\u05C3";
