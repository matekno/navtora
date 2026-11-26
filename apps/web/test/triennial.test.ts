import { describe, expect, it } from "vitest";
import { HDate } from "@hebcal/core";
import { POST } from "@/app/api/target/route";
import { getDictionary } from "@/lib/i18n";
import { getLocator } from "@/lib/locator";
import { resolveTargets } from "@/lib/targets";
import { readingYear, triennialPlacement } from "@/lib/triennial";
import type { ReadingInfo, TargetInfo } from "@/lib/target-types";

const es = getDictionary("es");
// 5787 is year 2 of the cycle that began in 5786
const NOW = new Date("2026-11-26T12:00:00");

function range(x: TargetInfo): string {
  return `${x.ref.chapter}:${x.ref.verse}-${x.endRef.chapter}:${x.endRef.verse}`;
}

function onDate(date: string, opts: { cycle?: "annual" | "triennial"; weekday?: "annual" | "triennial" } = {}): ReadingInfo {
  const res = resolveTargets({ kind: "today", date, ...opts }, "es", NOW);
  expect(res.readings).toHaveLength(1);
  return res.readings![0]!;
}

function wordsOf(chapter: number, verse: number): { startWord: number; endWord: number } {
  const text = getLocator().text;
  const ref = { book: 1, chapter, verse };
  return { startWord: text.startOfVerse(ref), endWord: text.endOfVerse(ref) };
}

describe("triennial cycle", () => {
  it("reads this year's third of the parashah on Shabbat", () => {
    const annual = onDate("2026-11-28");
    expect(annual.triennialYear).toBeUndefined();
    expect(range(annual.targets[0]!)).toBe("32:4-32:13");

    const tri = onDate("2026-11-28", { cycle: "triennial" });
    expect(tri.triennialYear).toBe(2);
    expect(tri.targets.map(range)).toEqual(["34:1-34:4", "34:5-34:12", "34:13-34:17", "34:18-34:23", "34:24-34:31", "35:1-35:11", "35:12-35:15", "35:12-35:15"]);
    expect(tri.summary).toBe("Bereshit 34:1 a 35:15");
  });

  it("keeps a special maftir from another book", () => {
    const tri = onDate("2026-12-05", { cycle: "triennial" });
    const maftir = tri.targets.find((x) => x.aliyah === "M")!;
    expect(maftir.book).toBe(4);
    expect(range(maftir)).toBe("7:1-7:17");
    expect(maftir.reason).toMatch(/Chanukah/);
    expect(tri.multipleBooks).toBe(true);
    expect(range(tri.targets[0]!)).toBe("38:1-38:5");
  });

  it("offers both weekday customs", () => {
    const annualCycle = onDate("2026-11-30");
    expect(annualCycle.note).toBeUndefined();

    const annual = onDate("2026-11-30", { cycle: "triennial", weekday: "annual" });
    expect(annual.targets.map(range)).toEqual(["37:1-37:3", "37:4-37:7", "37:8-37:11"]);
    expect(annual.triennialYear).toBeUndefined();
    expect(annual.note).toBe(es.target.weekdayAnnualNote);

    const tri = onDate("2026-11-30", { cycle: "triennial", weekday: "triennial" });
    expect(tri.targets.map(range)).toEqual(["38:1-38:5", "38:6-38:11", "38:12-38:14"]);
    expect(tri.triennialYear).toBe(2);
    expect(tri.note).toBe(es.target.weekdayTriennialNote);
  });

  it("reads the Shabbat's first three aliyot on weekdays as they are, even when they are short", () => {
    // Ki Teitzei, year 3: nine verses, nothing added
    const tri = onDate("2028-08-28", { cycle: "triennial", weekday: "triennial" });
    expect(tri.targets.map(range)).toEqual(["24:14-24:16", "24:17-24:19", "24:20-24:22"]);
    const shabbat = onDate("2028-09-02", { cycle: "triennial" });
    expect(shabbat.targets.slice(0, 3).map(range)).toEqual(tri.targets.map(range));
    // it doesn't decide what to do: it warns, and points to the sources
    expect(tri.warning).toEqual({ text: es.target.shortWeekday(9), href: "/es/blog/triennial#lunes-y-jueves" });
    expect(onDate("2026-11-30", { cycle: "triennial", weekday: "triennial" }).warning).toBeUndefined();
  });

  it("leaves holidays as they are", () => {
    const annual = onDate("2027-04-22");
    const tri = onDate("2027-04-22", { cycle: "triennial", weekday: "triennial" });
    expect(tri.targets.map(range)).toEqual(annual.targets.map(range));
    expect(tri.triennialYear).toBeUndefined();
  });

  it("picks a parashah by year of the cycle, this year's by default", () => {
    const current = resolveTargets({ kind: "aliyah", parasha: 22, cycle: "triennial" }, "es", NOW);
    expect(current.triennial).toMatchObject({ year: 2, current: 2, dateISO: "2027-03-06", together: null });
    expect(current.targets).toHaveLength(8);
    expect(range(current.targets[0]!)).toBe("37:17-37:19");
    expect(current.targets[0]!.label).toBe("Vaiakhel, primera aliá");

    // in 5786 Vayakhel and Pekudei were read together
    const together = resolveTargets({ kind: "aliyah", parasha: 22, cycle: "triennial", triYear: 1 }, "es", NOW);
    expect(together.triennial).toMatchObject({ year: 1, current: 2, dateISO: "2026-03-14", together: "Vaiakhel-Pekudei" });
    expect(range(together.targets[0]!)).toBe("35:1-35:10");

    const third = resolveTargets({ kind: "aliyah", parasha: 22, aliyah: 3, cycle: "triennial" }, "es", NOW);
    expect(third.targets.map(range)).toEqual(["37:25-37:29"]);
    expect(third.readings![0]!.targets).toHaveLength(8);
  });

  it("goes on with last year's readings until Simchat Torah", () => {
    expect(readingYear(new HDate(new Date("2026-10-01T12:00:00")), false)).toBe(5786);
    expect(readingYear(new HDate(new Date("2026-10-10T12:00:00")), false)).toBe(5787);
  });

  it("tells which triennial aliyah a scan is in, or that it is outside this year's reading", () => {
    const inside = triennialPlacement(wordsOf(34, 5), [8], false, es, NOW)!;
    expect(inside.year).toBe(2);
    expect(inside.aliyot).toEqual([{ reading: "Vaishlaj", n: 2, startsHere: true }]);

    const outside = triennialPlacement(wordsOf(32, 10), [8], false, es, NOW)!;
    expect(outside.aliyot).toEqual([]);
    expect(outside.portions).toEqual([{ name: "Vaishlaj", summary: "Bereshit 34:1 a 35:15" }]);
  });
});

describe("/api/target cycle options", () => {
  function post(body: unknown): Promise<Response> {
    return POST(new Request("http://localhost/api/target", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  }

  it("rejects an unknown cycle or year", async () => {
    expect((await post({ kind: "today", cycle: "weekly" })).status).toBe(400);
    expect((await post({ kind: "today", cycle: "triennial", weekday: "monthly" })).status).toBe(400);
    expect((await post({ kind: "aliyah", parasha: 1, cycle: "triennial", triYear: 4 })).status).toBe(400);
  });

  it("answers a triennial date", async () => {
    const res = await post({ kind: "today", date: "2026-11-28", cycle: "triennial", lang: "es" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { readings: ReadingInfo[] };
    expect(body.readings[0]!.triennialYear).toBe(2);
  });
});
