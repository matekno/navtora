/**
 * Anonymous usage: who opened the app (a random id made on the phone, no
 * account and no IP), each scan's result, and the feedback people leave.
 * Every function swallows database errors: counting must never break a scan.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";

/** Random ids for scans and feedback, URL-safe. */
export function newId(): string {
  return randomBytes(12).toString("base64url");
}

/** The anonymous id the phone sends, or null if it doesn't look like one. */
export function parseClientId(v: unknown): string | null {
  return typeof v === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v) ? v : null;
}

/** YYYY-MM-DD in the server's time zone (TZ). */
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

function safely<T>(what: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    console.error(JSON.stringify({ evt: "db_error", what, message: err instanceof Error ? err.message : String(err) }));
    return fallback;
  }
}

/** Marks the client as active today. */
export function touchClient(client: string | null, lang: string | null, now: Date = new Date()): void {
  const db = getDb();
  if (!db || !client) return;
  safely(
    "touch",
    () => {
      const ts = now.toISOString();
      db.prepare(
        "INSERT INTO clients (id, first_seen, last_seen, lang) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, lang = coalesce(excluded.lang, lang)",
      ).run(client, ts, ts, lang);
      db.prepare("INSERT OR IGNORE INTO client_days (client, day) VALUES (?, ?)").run(client, localDay(now));
    },
    undefined,
  );
}

export interface ScanRecord {
  client: string | null;
  kind: "camera" | "manual";
  status: "confident" | "ambiguous" | "insufficient" | "error";
  lines?: number | null;
  ocrMs?: number | null;
  totalMs?: number | null;
  book?: number | null;
  parasha?: number | null;
  column?: number | null;
  /** "here", a column count, or "?" when navigating to a target */
  nav?: string | null;
  target?: string | null;
  /** what was read or typed, to see why a scan failed */
  text?: string | null;
  lang?: string | null;
}

/** Stores a scan and returns its id, for feedback; null if the database is unavailable. */
export function recordScan(s: ScanRecord, now: Date = new Date()): string | null {
  const db = getDb();
  if (!db) return null;
  touchClient(s.client, s.lang ?? null, now);
  return safely(
    "scan",
    () => {
      const id = newId();
      db.prepare(
        "INSERT INTO scans (id, ts, day, client, kind, status, lines, ocr_ms, total_ms, book, parasha, col, nav, target, text, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        now.toISOString(),
        localDay(now),
        s.client,
        s.kind,
        s.status,
        s.lines ?? null,
        s.ocrMs ?? null,
        s.totalMs ?? null,
        s.book ?? null,
        s.parasha ?? null,
        s.column ?? null,
        s.nav ?? null,
        s.target?.slice(0, 200) ?? null,
        s.text?.slice(0, 4000) ?? null,
        s.lang ?? null,
      );
      return id;
    },
    null,
  );
}

export const VOTES = ["up", "down"] as const;
export type Vote = (typeof VOTES)[number];
export const FEEDBACK_REASONS = ["wrong-place", "wrong-move", "slow", "confusing", "other", "uncertain"] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export interface FeedbackRecord {
  scan: string | null;
  client: string | null;
  vote: Vote | null;
  reason?: FeedbackReason | null;
  comment?: string | null;
  photo?: string | null;
  lang?: string | null;
}

export function recordFeedback(f: FeedbackRecord, id: string = newId(), now: Date = new Date()): string | null {
  const db = getDb();
  if (!db) return null;
  return safely(
    "feedback",
    () => {
      db.prepare("INSERT INTO feedback (id, ts, day, scan, client, vote, reason, comment, photo, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        id,
        now.toISOString(),
        localDay(now),
        f.scan,
        f.client,
        f.vote,
        f.reason ?? null,
        f.comment ?? null,
        f.photo ?? null,
        f.lang ?? null,
      );
      return id;
    },
    null,
  );
}

/** Adds details to feedback the same client left. Returns false if there is no such feedback. */
export function updateFeedback(id: string, client: string | null, details: { reason?: FeedbackReason | null; comment?: string | null; photo?: string | null }): boolean {
  const db = getDb();
  if (!db) return false;
  return safely(
    "feedback_update",
    () => {
      const res = db
        .prepare("UPDATE feedback SET reason = coalesce(?, reason), comment = coalesce(?, comment), photo = coalesce(?, photo) WHERE id = ? AND client IS ?")
        .run(details.reason ?? null, details.comment ?? null, details.photo ?? null, id, client);
      return Number(res.changes) > 0;
    },
    false,
  );
}

export function feedbackExists(id: string, client: string | null): boolean {
  const db = getDb();
  if (!db) return false;
  return safely("feedback_exists", () => db.prepare("SELECT 1 FROM feedback WHERE id = ? AND client IS ?").get(id, client) !== undefined, false);
}

export function scanExists(id: string): boolean {
  const db = getDb();
  if (!db) return false;
  return safely("scan_exists", () => db.prepare("SELECT 1 FROM scans WHERE id = ?").get(id) !== undefined, false);
}

/** Deletes feedback and returns the photo file it had, if any. */
export function deleteFeedback(id: string): { deleted: boolean; photo: string | null } {
  const db = getDb();
  if (!db) return { deleted: false, photo: null };
  return safely(
    "feedback_delete",
    () => {
      const row = db.prepare("SELECT photo FROM feedback WHERE id = ?").get(id) as { photo: string | null } | undefined;
      if (!row) return { deleted: false, photo: null };
      db.prepare("DELETE FROM feedback WHERE id = ?").run(id);
      return { deleted: true, photo: row.photo };
    },
    { deleted: false, photo: null },
  );
}

export function feedbackPhoto(id: string): string | null {
  const db = getDb();
  if (!db) return null;
  return safely("feedback_photo", () => (db.prepare("SELECT photo FROM feedback WHERE id = ?").get(id) as { photo: string | null } | undefined)?.photo ?? null, null);
}

// ---- admin ----

export interface RangeStats {
  users: number;
  newUsers: number;
  scans: number;
  confident: number;
  ambiguous: number;
  insufficient: number;
  errors: number;
  up: number;
  down: number;
  photos: number;
  /** median time from photo to answer, camera scans only */
  medianMs: number | null;
}

export interface DayStats extends Omit<RangeStats, "medianMs" | "photos"> {
  day: string;
}

export interface ScanRow {
  id: string;
  ts: string;
  kind: string;
  status: string;
  lines: number | null;
  total_ms: number | null;
  book: number | null;
  parasha: number | null;
  col: number | null;
  nav: string | null;
  target: string | null;
  text: string | null;
  lang: string | null;
}

export interface FeedbackRow {
  id: string;
  ts: string;
  vote: string | null;
  reason: string | null;
  comment: string | null;
  photo: string | null;
  lang: string | null;
  scan_status: string | null;
  scan_kind: string | null;
  book: number | null;
  parasha: number | null;
  col: number | null;
  nav: string | null;
  text: string | null;
}

export interface AdminStats {
  today: RangeStats;
  week: RangeStats;
  month: RangeStats;
  total: RangeStats;
  days: DayStats[];
  scans: ScanRow[];
  feedback: FeedbackRow[];
}

const EMPTY_RANGE: RangeStats = { users: 0, newUsers: 0, scans: 0, confident: 0, ambiguous: 0, insufficient: 0, errors: 0, up: 0, down: 0, photos: 0, medianMs: null };

const SCAN_COUNTS = `count(*) AS scans,
  coalesce(sum(status = 'confident'), 0) AS confident,
  coalesce(sum(status = 'ambiguous'), 0) AS ambiguous,
  coalesce(sum(status = 'insufficient'), 0) AS insufficient,
  coalesce(sum(status = 'error'), 0) AS errors`;
const FEEDBACK_COUNTS = `coalesce(sum(vote = 'up'), 0) AS up, coalesce(sum(vote = 'down'), 0) AS down, coalesce(sum(photo IS NOT NULL), 0) AS photos`;

/** Local midnight at the start of `day`, as the ISO timestamp the tables store. */
function dayStartIso(day: string): string {
  return new Date(`${day}T00:00:00`).toISOString();
}

/** Stats from the start of local day `from` until now; all time when from is "". */
function rangeStats(from: string): RangeStats {
  const db = getDb();
  if (!db) return EMPTY_RANGE;
  const users = db.prepare("SELECT count(DISTINCT client) AS n FROM client_days WHERE day >= ?").get(from) as { n: number };
  const newUsers = db.prepare("SELECT count(*) AS n FROM clients WHERE first_seen >= ?").get(from ? dayStartIso(from) : "") as { n: number };
  const scans = db.prepare(`SELECT ${SCAN_COUNTS} FROM scans WHERE day >= ?`).get(from) as Pick<RangeStats, "scans" | "confident" | "ambiguous" | "insufficient" | "errors">;
  const fb = db.prepare(`SELECT ${FEEDBACK_COUNTS} FROM feedback WHERE day >= ?`).get(from) as Pick<RangeStats, "up" | "down" | "photos">;
  const times = (db.prepare("SELECT total_ms AS ms FROM scans WHERE day >= ? AND kind = 'camera' AND total_ms IS NOT NULL ORDER BY total_ms").all(from) as Array<{ ms: number }>).map((r) => r.ms);
  const medianMs = times.length ? times[Math.floor(times.length / 2)]! : null;
  return { users: users.n, newUsers: newUsers.n, ...scans, ...fb, medianMs };
}

export function adminStats(now: Date = new Date(), days = 14): AdminStats {
  const db = getDb();
  const today = localDay(now);
  const empty: AdminStats = { today: EMPTY_RANGE, week: EMPTY_RANGE, month: EMPTY_RANGE, total: EMPTY_RANGE, days: [], scans: [], feedback: [] };
  if (!db) return empty;
  return safely(
    "admin_stats",
    () => {
      const from = addDays(today, -(days - 1));
      const byDay = new Map<string, DayStats>();
      for (let i = 0; i < days; i++) {
        const day = addDays(today, -i);
        byDay.set(day, { day, users: 0, newUsers: 0, scans: 0, confident: 0, ambiguous: 0, insufficient: 0, errors: 0, up: 0, down: 0 });
      }
      for (const r of db.prepare("SELECT day, count(*) AS n FROM client_days WHERE day >= ? GROUP BY day").all(from) as Array<{ day: string; n: number }>) {
        const d = byDay.get(r.day);
        if (d) d.users = r.n;
      }
      for (const r of db.prepare("SELECT first_seen FROM clients WHERE first_seen >= ?").all(dayStartIso(from)) as Array<{ first_seen: string }>) {
        const d = byDay.get(localDay(new Date(r.first_seen)));
        if (d) d.newUsers++;
      }
      for (const r of db.prepare(`SELECT day, ${SCAN_COUNTS} FROM scans WHERE day >= ? GROUP BY day`).all(from) as unknown as DayStats[]) {
        const d = byDay.get(r.day);
        if (d) Object.assign(d, { scans: r.scans, confident: r.confident, ambiguous: r.ambiguous, insufficient: r.insufficient, errors: r.errors });
      }
      for (const r of db.prepare(`SELECT day, ${FEEDBACK_COUNTS} FROM feedback WHERE day >= ? GROUP BY day`).all(from) as unknown as DayStats[]) {
        const d = byDay.get(r.day);
        if (d) Object.assign(d, { up: r.up, down: r.down });
      }
      const scans = db
        .prepare("SELECT id, ts, kind, status, lines, total_ms, book, parasha, col, nav, target, text, lang FROM scans ORDER BY ts DESC, rowid DESC LIMIT 40")
        .all() as unknown as ScanRow[];
      const feedback = db
        .prepare(
          `SELECT f.id, f.ts, f.vote, f.reason, f.comment, f.photo, f.lang, s.status AS scan_status, s.kind AS scan_kind, s.book, s.parasha, s.col, s.nav, s.text
           FROM feedback f LEFT JOIN scans s ON s.id = f.scan ORDER BY f.ts DESC, f.rowid DESC LIMIT 60`,
        )
        .all() as unknown as FeedbackRow[];
      return {
        today: rangeStats(today),
        week: rangeStats(addDays(today, -6)),
        month: rangeStats(addDays(today, -29)),
        total: rangeStats(""),
        days: [...byDay.values()],
        scans,
        feedback,
      };
    },
    empty,
  );
}
