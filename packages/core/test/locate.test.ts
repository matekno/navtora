import { loadDataNode } from "../../data/src/index";
import { beforeAll, describe, expect, it } from "vitest";
import { createLocator, type Locator } from "../src/locate";
import { makeRng, noisyLines } from "../src/noise";
import { tokenizeHebrew } from "../src/normalize";

const data = loadDataNode();
let locator: Locator;

/** Texto consonántico de las líneas [from, to) de una columna del layout estándar. */
function columnLines(column: number, from: number, to: number): string[] {
  const col = data.layout.columns[column - 1]!;
  return col.lines.slice(from, to).map((l) => tokenizeHebrew(l.text).join(" ")).filter((l) => l.length > 0);
}

beforeAll(() => {
  locator = createLocator(data, { debug: true });
});

describe("locate sobre texto limpio", () => {
  it("ubica el principio de la columna 50 en Miketz", () => {
    const res = locator.locate({ lines: columnLines(50, 0, 8).map((text) => ({ text })) });
    expect(res.status).toBe("confident");
    expect(res.best?.book.n).toBe(1);
    expect(res.best?.parashot[0]?.name.en).toBe("Miketz");
    expect(res.best?.standardColumn?.column).toBe(50);
    expect(res.best?.standardColumn?.fromColumnStart).toBe(true);
    expect(res.best?.firstWords).toBe("ויאמר אלהם יוסף הוא");
  });

  it("ubica un tramo del medio de una columna y reporta la línea", () => {
    const res = locator.locate({ lines: columnLines(120, 20, 27).map((text) => ({ text })) });
    expect(res.status).toBe("confident");
    expect(res.best?.standardColumn?.column).toBe(120);
    expect(res.best?.standardColumn?.fromColumnStart).toBe(false);
    expect(res.best?.standardColumn?.firstLine).toBe(21);
  });

  it("acepta texto con nikud tipeado a mano", () => {
    const res = locator.locateText("וַיֹּ֥אמֶר אֲלֵהֶ֖ם יוֹסֵ֑ף ה֗וּא אֲשֶׁ֨ר דִּבַּ֧רְתִּי אֲלֵכֶ֛ם לֵאמֹ֖ר\nמְרַגְּלִ֥ים אַתֶּֽם׃ בְּזֹ֖את תִּבָּחֵ֑נוּ חֵ֤י פַרְעֹה֙");
    expect(res.status).toBe("confident");
    expect(res.best?.standardColumn?.column).toBe(50);
  });

  it("con muy pocas palabras se declara insuficiente", () => {
    const res = locator.locateText("ויאמר יהוה");
    expect(res.status).toBe("insufficient");
    expect(res.reasons.length).toBeGreaterThan(0);
  });
});

describe("honestidad", () => {
  it("un pasaje repetido de los nesiim se declara ambiguo o sale con margen bajo", () => {
    // Bamidbar 7: la fórmula de la ofrenda se repite doce veces casi igual
    const formula =
      "וקרבנו קערת כסף אחת שלשים ומאה משקלה מזרק אחד כסף שבעים שקל בשקל הקדש שניהם מלאים סלת בלולה בשמן למנחה כף אחת עשרה זהב מלאה קטרת פר אחד בן בקר איל אחד כבש אחד בן שנתו לעלה";
    const words = formula.split(" ");
    const lines: string[] = [];
    for (let i = 0; i < words.length; i += 7) lines.push(words.slice(i, i + 7).join(" "));
    const res = locator.locate({ lines: lines.map((text) => ({ text })) });
    expect(res.status).not.toBe("confident");
    expect(res.status).toBe("ambiguous");
    expect(res.alternatives.length).toBeGreaterThanOrEqual(2);
    for (const alt of res.alternatives) expect(alt.book.n).toBe(4);
  });

  it("texto que no es de la Torá no produce una posición con confianza", () => {
    const res = locator.locateText("שלום עולם היום יום יפה מאד בעיר הגדולה\nאנחנו הולכים לבית הספר עם החברים שלנו");
    expect(res.status).not.toBe("confident");
  });
});

describe("robustez ante ruido de OCR", () => {
  const WINDOWS = 150;

  function sample(seed: number): { lines: string[]; column: number; startWord: number; endWord: number } {
    const rng = makeRng(seed);
    const column = 1 + Math.floor(rng() * 245);
    const col = data.layout.columns[column - 1]!;
    const from = Math.floor(rng() * 30);
    const len = 6 + Math.floor(rng() * 5);
    const lines = col.lines.slice(from, from + len).filter((l) => l.end >= l.start);
    return {
      lines: lines.map((l) => tokenizeHebrew(l.text).join(" ")).filter((l) => l.length > 0),
      column,
      startWord: lines[0]!.start,
      endWord: lines[lines.length - 1]!.end,
    };
  }

  /** acierto: el span predicho se solapa con el tramo real en al menos la mitad del más corto */
  function overlaps(a: { startWord: number; endWord: number }, b: { startWord: number; endWord: number }): boolean {
    const overlap = Math.min(a.endWord, b.endWord) - Math.max(a.startWord, b.startWord) + 1;
    const shorter = Math.min(a.endWord - a.startWord, b.endWord - b.startWord) + 1;
    return overlap >= shorter * 0.5;
  }

  function sweep(cer: number): { top1: number; confidentWrong: number; abstain: number } {
    let top1 = 0;
    let confidentWrong = 0;
    let abstain = 0;
    for (let s = 1; s <= WINDOWS; s++) {
      const win = sample(s * 7919);
      const noisy = noisyLines(win.lines, { charErrorRate: cer, seed: s });
      const res = locator.locate({ lines: noisy.map((text) => ({ text })) });
      const best = res.best ?? res.alternatives[0];
      const hit = best !== undefined && overlaps(best.span, win);
      if (res.status === "confident") {
        if (hit) top1++;
        else confidentWrong++;
      } else {
        abstain++;
        if (hit) top1++;
      }
    }
    return { top1: top1 / WINDOWS, confidentWrong, abstain };
  }

  it("con 20 % de error por letra ubica casi todo y nunca afirma una posición equivocada", () => {
    const r = sweep(0.2);
    expect(r.confidentWrong).toBe(0);
    expect(r.top1).toBeGreaterThanOrEqual(0.99);
  });

  it("con 35 % de error por letra sigue sin afirmar posiciones equivocadas", () => {
    const r = sweep(0.35);
    expect(r.confidentWrong).toBe(0);
  });
});
