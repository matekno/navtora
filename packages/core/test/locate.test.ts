import { loadDataNode } from "../../data/src/index";
import { beforeAll, describe, expect, it } from "vitest";
import { createLocator, type Locator } from "../src/locate";
import { makeRng, noisyLines } from "../src/noise";
import { tokenizeHebrew } from "../src/normalize";

const data = loadDataNode();
let locator: Locator;

/** Consonantal text of lines [from, to) of a standard-layout column. */
function columnLines(column: number, from: number, to: number): string[] {
  const col = data.layout.columns[column - 1]!;
  return col.lines.slice(from, to).map((l) => tokenizeHebrew(l.text).join(" ")).filter((l) => l.length > 0);
}

beforeAll(() => {
  locator = createLocator(data, { debug: true });
});

describe("locate on clean text", () => {
  it("finds the start of column 50 in Miketz", () => {
    const res = locator.locate({ lines: columnLines(50, 0, 8).map((text) => ({ text })) });
    expect(res.status).toBe("confident");
    expect(res.best?.book.n).toBe(1);
    expect(res.best?.parashot[0]?.name.en).toBe("Miketz");
    expect(res.best?.standardColumn?.column).toBe(50);
    expect(res.best?.standardColumn?.fromColumnStart).toBe(true);
    expect(res.best?.firstWords).toBe("ויאמר אלהם יוסף הוא");
  });

  it("finds a span in the middle of a column and reports the line", () => {
    const res = locator.locate({ lines: columnLines(120, 20, 27).map((text) => ({ text })) });
    expect(res.status).toBe("confident");
    expect(res.best?.standardColumn?.column).toBe(120);
    expect(res.best?.standardColumn?.fromColumnStart).toBe(false);
    expect(res.best?.standardColumn?.firstLine).toBe(21);
  });

  it("accepts hand-typed text with nikkud", () => {
    const res = locator.locateText("וַיֹּ֥אמֶר אֲלֵהֶ֖ם יוֹסֵ֑ף ה֗וּא אֲשֶׁ֨ר דִּבַּ֧רְתִּי אֲלֵכֶ֛ם לֵאמֹ֖ר\nמְרַגְּלִ֥ים אַתֶּֽם׃ בְּזֹ֖את תִּבָּחֵ֑נוּ חֵ֤י פַרְעֹה֙");
    expect(res.status).toBe("confident");
    expect(res.best?.standardColumn?.column).toBe(50);
  });

  it("reports insufficient with very few words", () => {
    const res = locator.locateText("ויאמר יהוה");
    expect(res.status).toBe("insufficient");
    expect(res.reasons.length).toBeGreaterThan(0);
  });
});

describe("honesty", () => {
  it("reports a repeated nesiim passage as ambiguous", () => {
    // Bamidbar 7: the offering formula repeats twelve times almost verbatim
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

  it("does not confidently place non-Torah text", () => {
    const res = locator.locateText("שלום עולם היום יום יפה מאד בעיר הגדולה\nאנחנו הולכים לבית הספר עם החברים שלנו");
    expect(res.status).not.toBe("confident");
  });
});

describe("robustness to OCR noise", () => {
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

  /** hit: the predicted span overlaps the true span by at least half of the shorter one */
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

  it("at 20% character error, finds almost everything and never asserts a wrong position", () => {
    const r = sweep(0.2);
    expect(r.confidentWrong).toBe(0);
    expect(r.top1).toBeGreaterThanOrEqual(0.99);
  });

  it("at 35% character error, still never asserts a wrong position", () => {
    const r = sweep(0.35);
    expect(r.confidentWrong).toBe(0);
  });
});
