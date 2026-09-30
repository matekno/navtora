import { describe, expect, it } from "vitest";
import { normalizeHebrew, tokenizeHebrew } from "../src/normalize";
import { isConfusable, weightedEditDistance, wordSimilarity } from "../src/distance";

describe("normalizeHebrew", () => {
  it("strips nikkud and cantillation", () => {
    expect(normalizeHebrew("בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים")).toBe("בראשית ברא אלהים");
  });
  it("splits on maqaf and drops sof pasuk", () => {
    expect(normalizeHebrew("עַל־פְּנֵ֣י תְה֑וֹם׃")).toBe("על פני תהום");
  });
  it("strips qamats qatan and shin dots", () => {
    expect(normalizeHebrew("כׇּל־יִשְׂרָאֵֽל׃")).toBe("כל ישראל");
  });
  it("keeps the ? wildcard and drops Latin letters and digits", () => {
    expect(normalizeHebrew("ויא?ר abc 12 אלהים")).toBe("ויא?ר אלהים");
  });
  it("tokenizes without empty tokens", () => {
    expect(tokenizeHebrew("  וַיֹּ֥אמֶר   אֲלֵהֶ֖ם  ")).toEqual(["ויאמר", "אלהם"]);
    expect(tokenizeHebrew("   ")).toEqual([]);
  });
});

describe("weighted distance", () => {
  it("is zero for identical words", () => {
    expect(weightedEditDistance("אלהים", "אלהים")).toBe(0);
  });
  it("a confusable substitution costs less than an arbitrary one", () => {
    expect(isConfusable("ב", "כ")).toBe(true);
    expect(weightedEditDistance("ברא", "כרא")).toBeLessThan(weightedEditDistance("ברא", "שרא"));
  });
  it("the wildcard is cheap", () => {
    expect(weightedEditDistance("ויאמר", "ויא?ר")).toBeLessThan(0.5);
  });
  it("similarity drops with the error's relative length", () => {
    expect(wordSimilarity("בראשית", "כראשית")).toBeGreaterThan(0.9);
    expect(wordSimilarity("את", "אל")).toBeLessThan(0.6);
    expect(wordSimilarity("בראשית", "שמות")).toBe(0);
  });
});
