/**
 * Simulador de ruido de OCR sobre texto consonántico. Sirve para medir el
 * matcher sin gastar en OCR real y para los tests. Determinista por semilla.
 */
import { isConfusable } from "./distance";

export interface NoiseOptions {
  /** probabilidad de error por letra */
  charErrorRate: number;
  /** probabilidad de perder una palabra entera */
  wordDropRate: number;
  /** probabilidad de pegar una palabra con la siguiente */
  wordMergeRate: number;
  /** probabilidad de partir una palabra en dos */
  wordSplitRate: number;
  /** probabilidad de perder una línea entera */
  lineDropRate: number;
  seed: number;
}

export const DEFAULT_NOISE: NoiseOptions = {
  charErrorRate: 0.2,
  wordDropRate: 0.05,
  wordMergeRate: 0.03,
  wordSplitRate: 0.03,
  lineDropRate: 0.05,
  seed: 1,
};

const LETTERS = "אבגדהוזחטיכלמנסעפצקרשתךםןףץ";

/** PRNG mulberry32, determinista. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function confusablePartner(ch: string, rng: () => number): string {
  const partners = [...LETTERS].filter((c) => c !== ch && isConfusable(ch, c));
  if (partners.length === 0) return LETTERS[Math.floor(rng() * LETTERS.length)]!;
  return partners[Math.floor(rng() * partners.length)]!;
}

export function noisyWord(word: string, cer: number, rng: () => number): string {
  let out = "";
  for (const ch of word) {
    if (rng() >= cer) {
      out += ch;
      continue;
    }
    const r = rng();
    if (r < 0.5) out += confusablePartner(ch, rng);
    else if (r < 0.75) {
      /* letra perdida */
    } else if (r < 0.9) out += "?";
    else out += ch + LETTERS[Math.floor(rng() * LETTERS.length)]!;
  }
  return out;
}

/** Aplica ruido a líneas de texto consonántico. Devuelve las líneas resultantes. */
export function noisyLines(lines: string[], opts: Partial<NoiseOptions> = {}): string[] {
  const o = { ...DEFAULT_NOISE, ...opts };
  const rng = makeRng(o.seed);
  const out: string[] = [];
  for (const line of lines) {
    if (rng() < o.lineDropRate) continue;
    const words = line.split(" ").filter((w) => w.length > 0);
    const result: string[] = [];
    for (let i = 0; i < words.length; i++) {
      if (rng() < o.wordDropRate) continue;
      let w = noisyWord(words[i]!, o.charErrorRate, rng);
      if (rng() < o.wordMergeRate && i + 1 < words.length) {
        w += noisyWord(words[i + 1]!, o.charErrorRate, rng);
        i++;
      } else if (rng() < o.wordSplitRate && w.length >= 4) {
        const cut = 1 + Math.floor(rng() * (w.length - 2));
        result.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      if (w.length > 0) result.push(w);
    }
    out.push(result.join(" "));
  }
  return out;
}
