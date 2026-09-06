import { describe, expect, it } from "vitest";
import { loadDataNode } from "../src/index";

const { torah, layout, parashot } = loadDataNode();

describe("torah.json", () => {
  it("tiene la cantidad esperada de palabras y versículos", () => {
    expect(torah.words.length).toBe(torah.wordCount);
    expect(torah.words.length).toBeGreaterThan(79_000);
    expect(torah.words.length).toBeLessThan(80_500);
    // la cuenta tradicional de versículos de la Torá es 5845; la numeración de Sefaria da 5846
    expect(torah.verses.length).toBeGreaterThanOrEqual(5845);
    expect(torah.verses.length).toBeLessThanOrEqual(5846);
    // ningún versículo repetido
    const keys = new Set(torah.verses.map((v) => `${v.book}:${v.chapter}:${v.verse}`));
    expect(keys.size).toBe(torah.verses.length);
  });

  it("empieza en בראשית y termina en ישראל", () => {
    expect(torah.words[0]).toBe("בראשית");
    expect(torah.words.at(-1)).toBe("ישראל");
  });

  it("sólo contiene letras hebreas", () => {
    for (const w of torah.words) expect(w).toMatch(/^[א-ת]+$/);
  });

  it("las referencias de versículo son monótonas y consistentes", () => {
    for (let i = 1; i < torah.wordVerse.length; i++) {
      expect(torah.wordVerse[i]! - torah.wordVerse[i - 1]!).toBeGreaterThanOrEqual(0);
      expect(torah.wordVerse[i]! - torah.wordVerse[i - 1]!).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < torah.verses.length; i++) {
      expect(torah.verses[i]!.start).toBeGreaterThan(torah.verses[i - 1]!.start);
    }
    expect(torah.verses[0]).toMatchObject({ book: 1, chapter: 1, verse: 1, start: 0 });
    expect(torah.verses.at(-1)).toMatchObject({ book: 5, chapter: 34, verse: 12 });
  });

  it("tiene alrededor de 290 petujot", () => {
    expect(torah.petuchaBefore.length).toBeGreaterThan(250);
    expect(torah.petuchaBefore.length).toBeLessThan(320);
  });
});

describe("layout-245.json", () => {
  it("tiene 245 columnas contiguas", () => {
    expect(layout.columns.length).toBe(245);
    expect(layout.columns[0]!.startWord).toBe(0);
    for (let i = 1; i < layout.columns.length; i++) {
      expect(layout.columns[i]!.startWord).toBe(layout.columns[i - 1]!.endWord + 1);
    }
    expect(layout.columns.at(-1)!.endWord).toBe(torah.words.length - 1);
  });

  it("cada columna tiene entre 40 y 43 líneas", () => {
    for (const c of layout.columns) {
      expect(c.lines.length).toBeGreaterThanOrEqual(40);
      expect(c.lines.length).toBeLessThanOrEqual(43);
    }
  });

  it("la columna 50 empieza con ויאמר אלהם יוסף", () => {
    const c = layout.columns[49]!;
    expect(torah.words.slice(c.startWord, c.startWord + 3).join(" ")).toBe("ויאמר אלהם יוסף");
  });
});

describe("parashot.json", () => {
  it("tiene 54 parashot contiguas que cubren todo el texto", () => {
    expect(parashot.length).toBe(54);
    expect(parashot[0]!.startWord).toBe(0);
    for (let i = 1; i < parashot.length; i++) {
      expect(parashot[i]!.startWord).toBe(parashot[i - 1]!.endWord + 1);
    }
    expect(parashot.at(-1)!.endWord).toBe(torah.words.length - 1);
  });

  it("cada parashá tiene 7 aliot contiguas más maftir dentro de la séptima", () => {
    for (const p of parashot) {
      const regular = p.aliyot.filter((a) => a.n !== "M");
      expect(regular.length).toBe(7);
      expect(regular[0]!.startWord).toBe(p.startWord);
      for (let i = 1; i < regular.length; i++) {
        expect(regular[i]!.startWord).toBe(regular[i - 1]!.endWord + 1);
      }
      expect(regular[6]!.endWord).toBe(p.endWord);
      const maftir = p.aliyot.find((a) => a.n === "M");
      if (p.name.en === "Vezot Haberakhah") expect(maftir).toBeUndefined();
      else expect(maftir?.endWord).toBe(p.endWord);
    }
  });

  it("Miketz contiene la columna 50", () => {
    const miketz = parashot.find((p) => p.name.en === "Miketz")!;
    const c = layout.columns[49]!;
    expect(c.startWord).toBeGreaterThanOrEqual(miketz.startWord);
    expect(c.endWord).toBeLessThanOrEqual(miketz.endWord);
  });
});
