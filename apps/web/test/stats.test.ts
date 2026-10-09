import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, setDb } from "@/lib/db";
import { adminStats, deleteFeedback, feedbackExists, localDay, parseClientId, recordFeedback, recordScan, touchClient, updateFeedback } from "@/lib/stats";

const NOW = new Date("2026-10-08T12:00:00");
const YESTERDAY = new Date("2026-10-07T12:00:00");

describe("stats", () => {
  beforeEach(() => setDb(openDatabase(":memory:")));
  afterEach(() => setDb(null));

  it("accepts only id-like client ids", () => {
    expect(parseClientId("0b6c7a8e-1f2d-4c3b-9a8e-7d6c5b4a3f2e")).not.toBeNull();
    expect(parseClientId("short")).toBeNull();
    expect(parseClientId("has spaces in it")).toBeNull();
    expect(parseClientId(42)).toBeNull();
  });

  it("counts people, scans and feedback by day", () => {
    touchClient("client-aaaa", "es", YESTERDAY);
    touchClient("client-aaaa", "es", NOW);
    touchClient("client-bbbb", "en", NOW);
    const ok = recordScan({ client: "client-aaaa", kind: "camera", status: "confident", totalMs: 2000, column: 12, text: "בראשית ברא" }, NOW);
    recordScan({ client: "client-bbbb", kind: "camera", status: "insufficient", totalMs: 3000 }, NOW);
    recordScan({ client: "client-bbbb", kind: "manual", status: "ambiguous" }, YESTERDAY);
    expect(ok).toMatch(/^[A-Za-z0-9_-]{16}$/);

    const up = recordFeedback({ scan: ok, client: "client-aaaa", vote: "up" }, undefined, NOW);
    const down = recordFeedback({ scan: ok, client: "client-bbbb", vote: "down" }, undefined, NOW)!;
    expect(updateFeedback(down, "client-aaaa", { reason: "slow" })).toBe(false);
    expect(updateFeedback(down, "client-bbbb", { reason: "wrong-place", comment: "otra parashá", photo: `${down}.jpg` })).toBe(true);
    expect(up).not.toBeNull();

    const s = adminStats(NOW);
    expect(s.today).toMatchObject({ users: 2, scans: 2, confident: 1, insufficient: 1, up: 1, down: 1, photos: 1, medianMs: 3000 });
    expect(s.week).toMatchObject({ users: 2, newUsers: 2, scans: 3, ambiguous: 1 });
    expect(s.total.scans).toBe(3);
    expect(s.days).toHaveLength(14);
    expect(s.days[0]).toMatchObject({ day: localDay(NOW), users: 2, newUsers: 1, scans: 2, up: 1, down: 1 });
    // client-bbbb also typed a passage yesterday
    expect(s.days[1]).toMatchObject({ day: localDay(YESTERDAY), users: 2, newUsers: 1, scans: 1 });
    expect(s.feedback[0]).toMatchObject({ reason: "wrong-place", comment: "otra parashá", scan_status: "confident", col: 12 });

    expect(deleteFeedback(down)).toEqual({ deleted: true, photo: `${down}.jpg` });
    expect(feedbackExists(down, "client-bbbb")).toBe(false);
  });

  it("keeps working without a database", () => {
    setDb(null);
    // a file can't hold the data directory
    process.env.DATA_DIR = `${__filename}/data`;
    expect(recordScan({ client: null, kind: "camera", status: "confident" })).toBeNull();
    expect(adminStats().scans).toEqual([]);
    delete process.env.DATA_DIR;
  });
});
