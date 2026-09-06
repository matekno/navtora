import type { Placement, VerseRef } from "@kore/core";

const ORDINALES = ["", "primera", "segunda", "tercera", "cuarta", "quinta", "sexta", "séptima"];

export function aliyahLabel(n: number | "M"): string {
  if (n === "M") return "maftir";
  return `${ORDINALES[n] ?? String(n)} aliá`;
}

export function refEs(ref: VerseRef, bookName: string): string {
  return `${bookName} ${ref.chapter}:${ref.verse}`;
}

export function versesEs(p: Placement): string {
  const b = p.book.name.es;
  const s = p.verses.start;
  const e = p.verses.end;
  if (s.chapter === e.chapter && s.verse === e.verse) return refEs(s, b);
  if (s.chapter === e.chapter) return `${b} ${s.chapter}:${s.verse} a ${e.verse}`;
  return `${b} ${s.chapter}:${s.verse} a ${e.chapter}:${e.verse}`;
}

export function aliyotEs(p: Placement): string {
  if (p.aliyot.length === 0) return "sin aliá identificada";
  const byParasha = new Map<string, Array<number | "M">>();
  for (const a of p.aliyot) {
    const key = a.parashaName.es;
    const list = byParasha.get(key) ?? [];
    list.push(a.n);
    byParasha.set(key, list);
  }
  return [...byParasha.entries()]
    .map(([parasha, ns]) => {
      const labels = ns.map(aliyahLabel);
      const text = labels.length === 1 ? labels[0]! : labels.slice(0, -1).join(", ") + " y " + labels[labels.length - 1]!;
      return byParasha.size > 1 ? `${text} de ${parasha}` : text;
    })
    .join("; ");
}

export function confidenceLabel(status: "confident" | "ambiguous" | "insufficient"): { text: string; tone: "ok" | "warn" | "bad" } {
  if (status === "confident") return { text: "Seguro", tone: "ok" };
  if (status === "ambiguous") return { text: "Más de un lugar posible", tone: "warn" };
  return { text: "No pude ubicarlo", tone: "bad" };
}
