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

describe("navigate con layout estándar", () => {
  it("hacia Devarim cuenta columnas exactas", () => {
    const { placement } = scanColumn(50);
    const miketz = data.parashot.find((p) => p.name.en === "Vayigash")!;
    const nav = navigate(placement, { word: miketz.startWord, label: "Vaigash, primera aliá", ref: miketz.start }, ctx);
    expect(nav.status).toBe("move");
    expect(nav.direction).toBe("towards-devarim");
    expect(nav.columnsExact).toBe(true);
    const targetCol = data.layout.columns.find((c) => miketz.startWord >= c.startWord && miketz.startWord <= c.endWord)!;
    expect(nav.columns).toBe(targetCol.n - 50);
    expect(nav.instruction).toMatch(/a la izquierda, hacia el final del sefer/);
  });

  it("hacia Bereshit cuando el objetivo está antes", () => {
    const { placement } = scanColumn(120);
    const t = targetFromVerse(locator.text, { book: 1, chapter: 1, verse: 1 }, "Bereshit")!;
    const nav = navigate(placement, t, ctx);
    expect(nav.direction).toBe("towards-bereshit");
    expect(nav.columns).toBe(119);
    expect(nav.instruction).toMatch(/a la derecha, hacia el principio del sefer/);
  });

  it("al llegar da la línea exacta y las primeras palabras", () => {
    // la tercera aliá de Miketz empieza en Bereshit 41:39; ubicamos su columna y escaneamos sólo el principio
    const miketz = data.parashot.find((p) => p.name.en === "Miketz")!;
    const aliyah = miketz.aliyot.find((a) => a.n === 3)!;
    const col = data.layout.columns.find((c) => aliyah.startWord >= c.startWord && aliyah.startWord <= c.endWord)!;
    const { placement, lineStarts } = scanColumn(col.n, 0, 8);
    const nav = navigate(placement, { word: aliyah.startWord, label: "Miketz, tercera aliá", ref: aliyah.start }, ctx, lineStarts);
    expect(nav.status).toBe("here");
    expect(nav.line?.exact).toBe(true);
    const expectedLine = col.lines.findIndex((l) => aliyah.startWord >= l.start && aliyah.startWord <= l.end) + 1;
    expect(nav.line?.line).toBe(expectedLine);
    expect(nav.line?.firstWords).toBe(locator.text.slice(aliyah.startWord, aliyah.startWord + 3));
    expect(nav.instruction).toMatch(/Llegaste/);
  });

  it("una columna de distancia se dice en singular", () => {
    const { placement } = scanColumn(10);
    const col11 = data.layout.columns[10]!;
    const nav = navigate(placement, { word: col11.startWord + 5, label: "prueba", ref: locator.text.refOf(col11.startWord + 5) }, ctx);
    expect(nav.columns).toBe(1);
    expect(nav.instruction).toMatch(/^1 columna a la izquierda/);
  });
});

describe("navigate sin layout conocido", () => {
  it("estima columnas con las palabras por columna observadas", () => {
    const { placement } = scanColumn(30);
    const noLayout = { ...placement, standardColumn: null, layout: { ...placement.layout, wordsPerColumn: 330, linesVisible: 42 } };
    const target = data.layout.columns[39]!.startWord;
    const nav = navigate(noLayout, { word: target, label: "prueba", ref: locator.text.refOf(target) }, { text: locator.text, layout: null });
    expect(nav.status).toBe("move");
    expect(nav.columnsExact).toBe(false);
    expect(nav.columns).toBeGreaterThanOrEqual(8);
    expect(nav.columns).toBeLessThanOrEqual(11);
    expect(nav.instruction).toMatch(/^Unas \d+ columnas/);
  });
});
