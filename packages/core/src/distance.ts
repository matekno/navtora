/**
 * Weighted edit distance tuned to the letter confusions typical of OCR on STA"M
 * script. Substituting confusable letters costs less than an arbitrary
 * substitution. The `?` wildcard (a letter the OCR could not read) matches any
 * letter at low cost.
 */

const CONFUSABLE_PAIRS: Array<[string, string]> = [
  ["ב", "כ"], ["ב", "נ"], ["כ", "נ"], ["ג", "נ"], ["ד", "ר"], ["ד", "ך"], ["ר", "ך"],
  ["ה", "ח"], ["ה", "ת"], ["ח", "ת"], ["ו", "ז"], ["ו", "י"], ["ו", "ן"], ["ז", "ן"],
  ["ם", "ס"], ["ם", "מ"], ["צ", "ץ"], ["פ", "ף"], ["כ", "ך"], ["נ", "ן"], ["מ", "ם"],
  ["ע", "צ"], ["ט", "מ"], ["ש", "ע"], ["א", "צ"], ["ל", "ך"], ["ג", "ז"], ["ק", "ה"],
];

const CONFUSABLE = new Set<string>();
for (const [a, b] of CONFUSABLE_PAIRS) {
  CONFUSABLE.add(a + b);
  CONFUSABLE.add(b + a);
}

export const COST = {
  substitution: 1.0,
  confusable: 0.45,
  wildcard: 0.3,
  insertion: 0.8,
  deletion: 0.8,
} as const;

/** True if the two letters are commonly confused in sefer script. */
export function isConfusable(a: string, b: string): boolean {
  return CONFUSABLE.has(a + b);
}

function substitutionCost(a: string, b: string): number {
  if (a === b) return 0;
  if (a === "?" || b === "?") return COST.wildcard;
  if (isConfusable(a, b)) return COST.confusable;
  return COST.substitution;
}

/** Weighted edit distance. Returns Infinity as soon as the cost exceeds `maxCost`. */
export function weightedEditDistance(a: string, b: string, maxCost = Infinity): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m * COST.insertion;
  if (m === 0) return n * COST.deletion;
  if (Math.abs(n - m) * Math.min(COST.insertion, COST.deletion) > maxCost) return Infinity;

  let prev = new Float64Array(m + 1);
  let curr = new Float64Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j * COST.insertion;

  for (let i = 1; i <= n; i++) {
    curr[0] = i * COST.deletion;
    let rowMin = curr[0]!;
    const ai = a[i - 1]!;
    for (let j = 1; j <= m; j++) {
      const del = prev[j]! + COST.deletion;
      const ins = curr[j - 1]! + COST.insertion;
      const sub = prev[j - 1]! + substitutionCost(ai, b[j - 1]!);
      const v = Math.min(del, ins, sub);
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > maxCost) return Infinity;
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[m]!;
}

/**
 * Similarity in [0, 1], 1 = identical. Normalized by the longer length so one
 * wrong letter weighs little in a long word and a lot in a short one.
 */
export function wordSimilarity(a: string, b: string, maxNormalizedDistance = 0.5): number {
  const len = Math.max(a.length, b.length);
  if (len === 0) return 1;
  const d = weightedEditDistance(a, b, maxNormalizedDistance * len);
  if (!Number.isFinite(d)) return 0;
  return Math.max(0, 1 - d / len);
}
