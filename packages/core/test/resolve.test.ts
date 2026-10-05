import { loadDataNode } from "../../data/src/index";
import { describe, expect, it } from "vitest";
import { matchStandardColumn } from "../src/resolve";
import type { AlignmentCandidate } from "../src/types";

const data = loadDataNode();

function candidate(startWord: number, endWord: number, lineStarts: Array<number | null>): AlignmentCandidate {
  return { startWord, endWord, score: 100, coverage: 0.9, alignedTokens: 100, linesCovered: lineStarts.length, lineStarts };
}

describe("matchStandardColumn", () => {
  it("ignores a misread first word or two that matched the end of the previous column", () => {
    const col = data.layout.columns[78]!; // column 79
    // a noisy reading aligned its first tokens to the last two words of column 78
    const cand = candidate(col.startWord - 2, col.endWord, [col.startWord - 2, col.lines[1]!.start, col.lines[2]!.start]);
    const m = matchStandardColumn(cand, data.layout)!;
    expect(m.column).toBe(79);
    expect(m.fromColumnStart).toBe(true);
    expect(m.firstLine).toBe(2); // the first aligned line inside column 79
  });

  it("keeps the column of the first word when the text really starts in the previous column", () => {
    // e.g. typed text: the last line of column 49, then the first lines of column 50
    const prev = data.layout.columns[48]!;
    const col = data.layout.columns[49]!;
    const lastLine = prev.lines[prev.lines.length - 1]!;
    expect(lastLine.end - lastLine.start + 1).toBeGreaterThan(3);
    const cand = candidate(lastLine.start, col.lines[2]!.end, [lastLine.start, col.lines[0]!.start, col.lines[1]!.start, col.lines[2]!.start]);
    const m = matchStandardColumn(cand, data.layout)!;
    expect(m.column).toBe(49);
    expect(m.firstLine).toBe(prev.lines.length);
  });

  it("names the column of a span inside one column", () => {
    const col = data.layout.columns[49]!; // column 50
    const m = matchStandardColumn(candidate(col.lines[5]!.start, col.lines[20]!.end, [col.lines[5]!.start]), data.layout)!;
    expect(m.column).toBe(50);
    expect(m.fromColumnStart).toBe(false);
    expect(m.firstLine).toBe(6);
  });
});
