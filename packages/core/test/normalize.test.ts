import { describe, expect, it } from "vitest";
import { normalizeHebrew, tokenizeHebrew } from "../src/normalize";
import { isConfusable, weightedEditDistance, wordSimilarity } from "../src/distance";

describe("normalizeHebrew", () => {
  it("quita nikud y taamim", () => {
    expect(normalizeHebrew("בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים")).toBe("בראשית ברא אלהים");
  });
  it("parte por maqaf y quita sof pasuk", () => {
    expect(normalizeHebrew("עַל־פְּנֵ֣י תְה֑וֹם׃")).toBe("על פני תהום");
  });
  it("quita qamats qatan y puntos de shin", () => {
    expect(normalizeHebrew("כׇּל־יִשְׂרָאֵֽל׃")).toBe("כל ישראל");
  });
  it("conserva el comodín ? y descarta latinas y dígitos", () => {
    expect(normalizeHebrew("ויא?ר abc 12 אלהים")).toBe("ויא?ר אלהים");
  });
  it("tokeniza sin vacíos", () => {
    expect(tokenizeHebrew("  וַיֹּ֥אמֶר   אֲלֵהֶ֖ם  ")).toEqual(["ויאמר", "אלהם"]);
    expect(tokenizeHebrew("   ")).toEqual([]);
  });
});

describe("distancia ponderada", () => {
  it("es cero para palabras iguales", () => {
    expect(weightedEditDistance("אלהים", "אלהים")).toBe(0);
  });
  it("una sustitución confundible cuesta menos que una arbitraria", () => {
    expect(isConfusable("ב", "כ")).toBe(true);
    expect(weightedEditDistance("ברא", "כרא")).toBeLessThan(weightedEditDistance("ברא", "שרא"));
  });
  it("el comodín es barato", () => {
    expect(weightedEditDistance("ויאמר", "ויא?ר")).toBeLessThan(0.5);
  });
  it("la similitud cae con la longitud relativa del error", () => {
    expect(wordSimilarity("בראשית", "כראשית")).toBeGreaterThan(0.9);
    expect(wordSimilarity("את", "אל")).toBeLessThan(0.6);
    expect(wordSimilarity("בראשית", "שמות")).toBe(0);
  });
});
