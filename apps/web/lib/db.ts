/**
 * SQLite database for anonymous usage, feedback and dedications. It lives in
 * DATA_DIR (default ./data), next to the photos people choose to send. It uses
 * node:sqlite, so there is no native module to build.
 *
 * Reading a column never depends on it: if the database can't be opened, the
 * app keeps working and only stops counting.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/** One entry per schema version; never edit an applied one, append a new one. */
const MIGRATIONS = [
  `
  CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    lang TEXT
  );
  -- one row per anonymous client and local day it used the app
  CREATE TABLE client_days (
    client TEXT NOT NULL,
    day TEXT NOT NULL,
    PRIMARY KEY (client, day)
  ) WITHOUT ROWID;
  CREATE TABLE scans (
    id TEXT PRIMARY KEY,
    ts TEXT NOT NULL,
    day TEXT NOT NULL,
    client TEXT,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    lines INTEGER,
    ocr_ms INTEGER,
    total_ms INTEGER,
    book INTEGER,
    parasha INTEGER,
    col INTEGER,
    nav TEXT,
    target TEXT,
    text TEXT,
    lang TEXT
  );
  CREATE INDEX scans_day ON scans(day);
  CREATE TABLE feedback (
    id TEXT PRIMARY KEY,
    ts TEXT NOT NULL,
    day TEXT NOT NULL,
    scan TEXT,
    client TEXT,
    vote TEXT,
    reason TEXT,
    comment TEXT,
    photo TEXT,
    lang TEXT
  );
  CREATE INDEX feedback_day ON feedback(day);
  CREATE TABLE dedications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created TEXT NOT NULL,
    kind TEXT NOT NULL,
    key TEXT,
    start_day TEXT NOT NULL,
    end_day TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT
  );
  CREATE INDEX dedications_range ON dedications(end_day, start_day);
  `,
];

// runtime data, outside the build: the ignore comments keep the bundler from tracing these paths
export function dataDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "data");
}

export function photosDir(): string {
  return path.join(/*turbopackIgnore: true*/ dataDir(), "photos");
}

/** Where a feedback photo is stored; `name` is reduced to a plain file name. */
export function photoPath(name: string): string {
  return path.join(/*turbopackIgnore: true*/ photosDir(), path.basename(name));
}

function migrate(db: DatabaseSync): void {
  const { user_version: version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[v]!);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
}

/** Opens a database at `file` (":memory:" for tests) with the schema applied. */
export function openDatabase(file: string): DatabaseSync {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000; PRAGMA synchronous = NORMAL;");
  migrate(db);
  return db;
}

let instance: DatabaseSync | null = null;
let failedAt = 0;

/** The app's database, or null when it can't be opened (retried after a minute). */
export function getDb(): DatabaseSync | null {
  if (instance) return instance;
  if (failedAt && Date.now() - failedAt < 60_000) return null;
  try {
    fs.mkdirSync(dataDir(), { recursive: true });
    instance = openDatabase(path.join(/*turbopackIgnore: true*/ dataDir(), "navtora.db"));
    failedAt = 0;
  } catch (err) {
    failedAt = Date.now();
    console.error(JSON.stringify({ evt: "db_error", message: err instanceof Error ? err.message : String(err) }));
  }
  return instance;
}

/** For tests: use this database instead of the one in DATA_DIR. */
export function setDb(db: DatabaseSync | null): void {
  instance = db;
  failedAt = 0;
}
