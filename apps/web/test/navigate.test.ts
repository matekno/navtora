import { describe, expect, it } from "vitest";
import { navigate, targetFromVerse, tokenizeHebrew } from "@navtora/core";
import { POST } from "@/app/api/navigate/route";
import { getLayout, getLocator } from "@/lib/locator";

/** Typed lines of a standard column, as a scan would read them. */
function readColumn(n: number, from: number, to: number) {
  const col = getLayout().columns[n - 1]!;
  const text = col.lines
    .slice(from, to)
    .map((l) => tokenizeHebrew(l.text.replace(/#\[[^\]]*\]/g, "").replace("#(פ)", "")).join(" "))
    .join("\n");
  const res = getLocator().locateText(text);
  expect(res.status).toBe("confident");
  return { best: res.best!, lineStarts: res.debug!.candidates[0]!.lineStarts };
}

function post(body: unknown): Promise<Response> {
  return POST(new Request("http://localhost/api/navigate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
}

describe("/api/navigate", () => {
  const locator = getLocator();

  it("works out the way from the last scan to a target chosen after it", async () => {
    const { best, lineStarts } = readColumn(76, 2, 9);
    const target = targetFromVerse(locator.text, { book: 1, chapter: 1, verse: 1 }, "Bereshit 1:1")!;
    const res = await post({ placement: { span: best.span, standardColumn: best.standardColumn, layout: best.layout }, lineStarts, target });
    expect(res.status).toBe(200);
    const { navigation } = (await res.json()) as { navigation: ReturnType<typeof navigate> };
    expect(navigation).toEqual(navigate(best, target, { text: locator.text, layout: getLayout() }, lineStarts));
    expect(navigation).toMatchObject({ status: "move", direction: "towards-bereshit", columns: 75, columnsExact: true });
  });

  it("says where the target starts when it is in the scanned column", async () => {
    const { best, lineStarts } = readColumn(78, 6, 20);
    // Shemot 15:1, the Song of the Sea, on line 6 of column 78
    const target = targetFromVerse(locator.text, { book: 2, chapter: 15, verse: 1 }, "Az yashir")!;
    const res = await post({ placement: { span: best.span, standardColumn: best.standardColumn, layout: best.layout }, lineStarts, target });
    const { navigation } = (await res.json()) as { navigation: ReturnType<typeof navigate> };
    expect(navigation.status).toBe("here");
    expect(navigation.line).toMatchObject({ line: 6, exact: true });
  });

  it("rejects a placement or a target that doesn't make sense", async () => {
    const { best } = readColumn(76, 2, 9);
    const target = targetFromVerse(locator.text, { book: 1, chapter: 1, verse: 1 }, "Bereshit 1:1")!;
    const placement = { span: best.span, standardColumn: best.standardColumn, layout: best.layout };
    expect((await post({ placement: { ...placement, span: { startWord: -5, endWord: 3 } }, target })).status).toBe(400);
    expect((await post({ placement: { ...placement, standardColumn: { column: 999, firstLine: 1 } }, target })).status).toBe(400);
    expect((await post({ placement, target: { ...target, word: 10_000_000 } })).status).toBe(400);
    expect((await post({ placement })).status).toBe(400);
  });
});
