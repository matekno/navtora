import { describe, expect, it } from "vitest";
import { loadDataNode } from "../../data/src/index";
import { createLocator } from "../src/locate";
import { navigate, targetFromVerse } from "../src/navigate";
import { tokenizeHebrew } from "../src/normalize";

const data = loadDataNode();
const locator = createLocator(data, { debug: true });
const ctx = { text: locator.text, layout: data.layout };

function scanColumn(column: number, from = 0, to = 14) {
  const col = data.layout.columns[column - 1]!;
  const lines = col.lines.slice(from, to).map((l) => tokenizeHebrew(l.text).join(" ")).filter((l) => l.length > 0);
  const res = locator.locate({ lines: lines.map((text) => ({ text })), lineCountVisible: col.lines.length });
  expect(res.status).toBe("confident");
  return { placement: res.best!, lineStarts: res.debug!.candidates[0]!.lineStarts };
}

describe("navigate with the standard layout", () => {
  it("counts exact columns towards Devarim", () => {
    const { placement } = scanColumn(50);
    const miketz = data.parashot.find((p) => p.name.en === "Vayigash")!;
    const nav = navigate(placement, { word: miketz.startWord, label: "Vayigash, first aliyah", ref: miketz.start }, ctx);
    expect(nav.status).toBe("move");
    expect(nav.direction).toBe("towards-devarim");
    expect(nav.columnsExact).toBe(true);
    const targetCol = data.layout.columns.find((c) => miketz.startWord >= c.startWord && miketz.startWord <= c.endWord)!;
    expect(nav.columns).toBe(targetCol.n - 50);
  });

  it("goes towards Bereshit when the target is earlier", () => {
    const { placement } = scanColumn(120);
    const t = targetFromVerse(locator.text, { book: 1, chapter: 1, verse: 1 }, "Bereshit")!;
    const nav = navigate(placement, t, ctx);
    expect(nav.direction).toBe("towards-bereshit");
    expect(nav.columns).toBe(119);
    expect(nav.columnsExact).toBe(true);
  });

  it("on arrival, gives the exact line and first words", () => {
    // Miketz's third aliyah starts at Bereshit 41:39; scan only the top of its column
    const miketz = data.parashot.find((p) => p.name.en === "Miketz")!;
    const aliyah = miketz.aliyot.find((a) => a.n === 3)!;
    const col = data.layout.columns.find((c) => aliyah.startWord >= c.startWord && aliyah.startWord <= c.endWord)!;
    const { placement, lineStarts } = scanColumn(col.n, 0, 8);
    const nav = navigate(placement, { word: aliyah.startWord, label: "Miketz, third aliyah", ref: aliyah.start }, ctx, lineStarts);
    expect(nav.status).toBe("here");
    expect(nav.line?.exact).toBe(true);
    const expectedLine = col.lines.findIndex((l) => aliyah.startWord >= l.start && aliyah.startWord <= l.end) + 1;
    expect(nav.line?.line).toBe(expectedLine);
    expect(nav.line?.firstWords).toBe(locator.text.slice(aliyah.startWord, aliyah.startWord + 3));
    expect(nav.line?.firstWordsVocalized).toMatch(/[\u05B0-\u05C7]/);
    expect(nav.columns).toBe(0);
  });

  it("reports one column for the adjacent column", () => {
    const { placement } = scanColumn(10);
    const col11 = data.layout.columns[10]!;
    const nav = navigate(placement, { word: col11.startWord + 5, label: "test", ref: locator.text.refOf(col11.startWord + 5) }, ctx);
    expect(nav.columns).toBe(1);
    expect(nav.columnsExact).toBe(true);
  });
});

describe("navigate without a known layout", () => {
  it("estimates columns from the observed words per column", () => {
    const { placement } = scanColumn(30);
    const noLayout = { ...placement, standardColumn: null, layout: { ...placement.layout, wordsPerColumn: 330, linesVisible: 42 } };
    const target = data.layout.columns[39]!.startWord;
    const nav = navigate(noLayout, { word: target, label: "test", ref: locator.text.refOf(target) }, { text: locator.text, layout: null });
    expect(nav.status).toBe("move");
    expect(nav.columnsExact).toBe(false);
    expect(nav.columns).toBeGreaterThanOrEqual(8);
    expect(nav.columns).toBeLessThanOrEqual(11);
    expect(nav.wordsPerColumnUsed).toBe(330);
  });
});
