import { wordSimilarity } from "./distance";

/**
 * Word index over the text: exact map from consonantal form to positions, a
 * trigram index over the vocabulary for fuzzy lookup, and IDF per form.
 */
export interface VocabCandidate {
  /** vocabulary form */
  form: string;
  /** similarity to the query token, in [0, 1] */
  similarity: number;
  idf: number;
  /** word indices where the form occurs */
  positions: readonly number[];
}

const BOUNDARY = "#";

function trigramsOf(word: string): string[] {
  const w = BOUNDARY + word + BOUNDARY;
  const out: string[] = [];
  for (let i = 0; i + 3 <= w.length; i++) out.push(w.slice(i, i + 3));
  return out;
}

export class WordIndex {
  private readonly exact = new Map<string, number[]>();
  private readonly trigram = new Map<string, string[]>();
  private readonly idfByForm = new Map<string, number>();
  private readonly maxIdf: number;

  constructor(words: readonly string[]) {
    for (let i = 0; i < words.length; i++) {
      const w = words[i]!;
      let list = this.exact.get(w);
      if (!list) {
        list = [];
        this.exact.set(w, list);
      }
      list.push(i);
    }
    const n = words.length;
    for (const [form, positions] of this.exact) {
      this.idfByForm.set(form, Math.log(n / positions.length));
      for (const g of trigramsOf(form)) {
        let forms = this.trigram.get(g);
        if (!forms) {
          this.trigram.set(g, (forms = []));
        }
        forms.push(form);
      }
    }
    this.maxIdf = Math.log(n);
  }

  get vocabularySize(): number {
    return this.exact.size;
  }

  positionsOf(form: string): readonly number[] {
    return this.exact.get(form) ?? [];
  }

  idf(form: string): number {
    return this.idfByForm.get(form) ?? this.maxIdf;
  }

  /**
   * Vocabulary candidates for an OCR token: the exact match (similarity 1) plus
   * nearby forms found via trigrams and weighted edit distance.
   */
  candidates(
    token: string,
    opts: { maxCandidates?: number; minSimilarity?: number; maxLengthDelta?: number } = {},
  ): VocabCandidate[] {
    const maxCandidates = opts.maxCandidates ?? 24;
    const minSimilarity = opts.minSimilarity ?? 0.62;
    const maxLengthDelta = opts.maxLengthDelta ?? 2;
    const out: VocabCandidate[] = [];

    const exactPositions = this.exact.get(token);
    if (exactPositions && !token.includes("?")) {
      out.push({ form: token, similarity: 1, idf: this.idf(token), positions: exactPositions });
    }

    // One- and two-letter words match exactly only; fuzzy matches on them are pure noise.
    if (token.length < 3) return out;

    const grams = trigramsOf(token);
    const counts = new Map<string, number>();
    for (const g of grams) {
      if (g.includes("?")) continue;
      const forms = this.trigram.get(g);
      if (!forms) continue;
      for (const f of forms) counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    // require at least a third of the token's trigrams to be shared (minimum 1)
    const needed = Math.max(1, Math.ceil((grams.length - 1) / 3));
    const scored: Array<{ form: string; similarity: number }> = [];
    for (const [form, c] of counts) {
      if (c < needed) continue;
      if (form === token) continue;
      if (Math.abs(form.length - token.length) > maxLengthDelta) continue;
      const s = wordSimilarity(token, form, 1 - minSimilarity);
      if (s >= minSimilarity) scored.push({ form, similarity: s });
    }
    scored.sort((a, b) => b.similarity - a.similarity);
    for (const { form, similarity } of scored.slice(0, maxCandidates)) {
      out.push({ form, similarity, idf: this.idf(form), positions: this.exact.get(form)! });
    }
    return out;
  }
}
