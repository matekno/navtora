import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, setDb } from "@/lib/db";
import { activeDedications, addDedication, jagPeriod, upcomingJaguim, upcomingWeeks, weekPeriod } from "@/lib/dedications";

describe("dedication periods", () => {
  it("names a week by its Shabbat's parashah", () => {
    expect(weekPeriod("2026-10-10", "es")).toEqual({ kind: "week", key: "2026-10-10", start: "2026-10-04", end: "2026-10-10", label: "Semana de Bereshit" });
    expect(weekPeriod("2026-10-17", "en")?.label).toBe("Week of Noach");
    // a doubled parashah
    expect(weekPeriod("2027-07-31", "en")?.label).toMatch(/^Week of Matot-Mas/);
    // a Shabbat during a jag takes the jag's name
    expect(weekPeriod("2027-04-24", "es")?.label).toBe("Semana de Pésaj");
  });

  it("rejects dates that aren't a Shabbat", () => {
    expect(weekPeriod("2026-10-11", "es")).toBeNull();
    expect(weekPeriod("2026-02-30", "es")).toBeNull();
    expect(weekPeriod("nope", "es")).toBeNull();
  });

  it("shows a jag from the week before it to its last day", () => {
    expect(jagPeriod("pesach-5787", "es")).toMatchObject({ start: "2027-04-15", end: "2027-04-29", label: "Pésaj" });
    // Purim is in Adar II in a leap year, in Adar otherwise
    expect(jagPeriod("purim-5787", "en")).toMatchObject({ start: "2027-03-16", end: "2027-03-23" });
    expect(jagPeriod("purim-5786", "en")).toMatchObject({ end: "2026-03-03" });
    expect(jagPeriod("sukkot-5788", "en")).toMatchObject({ start: "2027-10-09", end: "2027-10-24", label: "Sukkot and Simchat Torah" });
    expect(jagPeriod("tu-bishvat-5787", "en")).toBeNull();
  });

  it("lists the coming weeks and jaguim", () => {
    const from = new Date("2026-10-08T12:00:00");
    const weeks = upcomingWeeks("es", 3, from);
    expect(weeks.map((w) => w.key)).toEqual(["2026-10-10", "2026-10-17", "2026-10-24"]);
    const jaguim = upcomingJaguim("en", 400, from).map((j) => j.key);
    expect(jaguim[0]).toBe("chanukah-5787");
    expect(jaguim).toContain("rosh-hashanah-5788");
    expect(jaguim).not.toContain("sukkot-5787");
  });
});

describe("active dedications", () => {
  beforeEach(() => setDb(openDatabase(":memory:")));
  afterEach(() => setDb(null));

  it("shows a dedication only during its period, jaguim first", () => {
    const week = weekPeriod("2026-10-10", "es")!;
    addDedication({ kind: "week", key: week.key, start: week.start, end: week.end, name: "Familia Pérez", message: "Leilui nishmat" });
    addDedication({ kind: "custom", key: null, start: "2026-10-08", end: "2026-10-08", name: "Otro", message: null });
    const chanukah = jagPeriod("chanukah-5787", "es")!;
    addDedication({ kind: "jag", key: chanukah.key, start: chanukah.start, end: chanukah.end, name: "Los Cohen", message: null });

    expect(activeDedications("es", new Date("2026-10-08T12:00:00")).map((d) => [d.label, d.name])).toEqual([
      ["Semana de Bereshit", "Familia Pérez"],
      ["Dedicación", "Otro"],
    ]);
    expect(activeDedications("en", new Date("2026-10-11T12:00:00"))).toEqual([]);
    expect(activeDedications("en", new Date("2026-12-01T12:00:00")).map((d) => d.label)).toEqual(["Chanukah"]);
  });
});
