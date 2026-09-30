/**
 * Builds dist/torah.json, dist/layout-245.json and dist/parashot.json from the
 * raw tikkun.io data (MIT) pinned in raw/tikkun.
 *
 * Aliyah boundaries come from @hebcal/leyning (BSD-2) and are cross-checked
 * against tikkun.io's aliyah marks. Disagreements are reported; the build fails
 * only if a parashah is missing or the text structure is inconsistent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLeyningForParsha } from "@hebcal/leyning";
import { SOF_PASUK, tokenizeHebrew, type LayoutData, type ParashotData, type TorahData, type VerseRef } from "@navtora/core";

const here = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.resolve(here, "../raw/tikkun");
const DIST = path.resolve(here, "../dist");

interface RawLine {
  text: string[][];
  verses: VerseRef[];
  aliyot: Array<Record<string, number | string>>;
  isPetucha: boolean;
}
type RawToc = Record<string, Record<string, Record<string, { p: number; l: number }>>>;

const BOOK_EN: Record<number, string> = { 1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy" };
const BOOK_BY_EN = Object.fromEntries(Object.entries(BOOK_EN).map(([n, en]) => [en, Number(n)])) as Record<string, number>;

/** Hebcal parashah names in order, paired with Spanish transliterations. */
const PARASHOT: Array<[en: string, es: string]> = [
  ["Bereshit", "Bereshit"], ["Noach", "Nóaj"], ["Lech-Lecha", "Lej Lejá"], ["Vayera", "Vaierá"],
  ["Chayei Sara", "Jaiei Sará"], ["Toldot", "Toldot"], ["Vayetzei", "Vaietzé"], ["Vayishlach", "Vaishlaj"],
  ["Vayeshev", "Vaieshev"], ["Miketz", "Miketz"], ["Vayigash", "Vaigash"], ["Vayechi", "Vaiejí"],
  ["Shemot", "Shemot"], ["Vaera", "Vaerá"], ["Bo", "Bo"], ["Beshalach", "Beshalaj"], ["Yitro", "Itró"],
  ["Mishpatim", "Mishpatim"], ["Terumah", "Terumá"], ["Tetzaveh", "Tetzavé"], ["Ki Tisa", "Ki Tisá"],
  ["Vayakhel", "Vaiakhel"], ["Pekudei", "Pekudei"], ["Vayikra", "Vaikrá"], ["Tzav", "Tzav"], ["Shmini", "Sheminí"],
  ["Tazria", "Tazría"], ["Metzora", "Metzorá"], ["Achrei Mot", "Ajarei Mot"], ["Kedoshim", "Kedoshim"],
  ["Emor", "Emor"], ["Behar", "Behar"], ["Bechukotai", "Bejukotai"], ["Bamidbar", "Bamidbar"], ["Nasso", "Nasó"],
  ["Beha'alotcha", "Behaalotjá"], ["Sh'lach", "Shelaj"], ["Korach", "Kóraj"], ["Chukat", "Jukat"], ["Balak", "Balak"],
  ["Pinchas", "Pinjás"], ["Matot", "Matot"], ["Masei", "Masei"], ["Devarim", "Devarim"], ["Vaetchanan", "Vaetjanán"],
  ["Eikev", "Ékev"], ["Re'eh", "Reé"], ["Shoftim", "Shoftim"], ["Ki Teitzei", "Ki Tetzé"], ["Ki Tavo", "Ki Tavó"],
  ["Nitzavim", "Nitzavim"], ["Vayeilech", "Vaiélej"], ["Ha'azinu", "Haazinu"], ["Vezot Haberakhah", "Vezot Haberajá"],
];

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function parseRef(book: string, cv: string): VerseRef {
  const [c, v] = cv.split(":").map(Number);
  const b = BOOK_BY_EN[book];
  if (!b || !c || !v) throw new Error(`invalid reference: ${book} ${cv}`);
  return { book: b, chapter: c, verse: v };
}

function sameRef(a: VerseRef, b: VerseRef): boolean {
  return a.book === b.book && a.chapter === b.chapter && a.verse === b.verse;
}

function fmt(r: VerseRef): string {
  return `${BOOK_EN[r.book]} ${r.chapter}:${r.verse}`;
}

function main(): void {
  const commit = fs.readFileSync(path.join(RAW, "COMMIT"), "utf8").trim();
  const toc = readJson<RawToc>(path.join(RAW, "toc.json"));

  const words: string[] = [];
  const wordVerse: number[] = [];
  const verses: TorahData["verses"] = [];
  const petuchaBefore: number[] = [];
  const gapBefore: number[] = [];
  const columns: LayoutData["columns"] = [];
  /** tikkun.io aliyah marks, with the verses that start on the marked line */
  const aliyahMarks: Array<{ page: number; line: number; kind: string; n: number | string; verseStarts: number[] }> = [];

  let verseOpen = false;
  let placementMismatches = 0;
  let missingVerseRefs = 0;
  let internalSofPasuk = 0;
  const problems: string[] = [];

  for (let page = 1; page <= 245; page++) {
    const raw = readJson<RawLine[]>(path.join(RAW, "pages", `${page}.json`));
    const colStart = words.length;
    const lines: LayoutData["columns"][number]["lines"] = [];

    raw.forEach((line, li) => {
      const lineStart = words.length;
      const queue = [...line.verses];
      const verseStartsHere: number[] = [];
      let gapPending = false;
      let petuchaPending = line.isPetucha;
      let lineHadGap = false;
      const runs: string[] = [];
      for (const segment of line.text) {
        for (const run of segment) {
          runs.push(run);
        }
      }
      runs.forEach((run, ri) => {
        if (ri > 0) {
          gapPending = true;
          lineHadGap = true;
        }
        for (const rawWord of run.split(/\s+/).filter((w) => w.length > 0)) {
          const endsVerse = rawWord.includes(SOF_PASUK);
          const toks = tokenizeHebrew(rawWord);
          for (const tok of toks) {
            if (!verseOpen) {
              const ref = queue.shift();
              if (ref) {
                verses.push({ ...ref, start: words.length });
                verseStartsHere.push(verses.length - 1);
                // cross-check against the table of contents
                const tocEntry = toc[String(ref.book)]?.[String(ref.chapter)]?.[String(ref.verse)];
                if (tocEntry && (tocEntry.p !== page || tocEntry.l !== li + 1)) {
                  placementMismatches++;
                  if (problems.length < 20) problems.push(`${fmt(ref)}: ToC says p${tocEntry.p} l${tocEntry.l}, text is at p${page} l${li + 1}`);
                }
              } else {
                // sof pasuk with no new verse in the source: happens in the Ten Commandments,
                // where the lower cantillation splits verses that the numbering counts as one
                internalSofPasuk++;
                if (problems.length < 20) problems.push(`p${page} l${li + 1}: internal sof pasuk with no new verse, continuing ${fmt(verses[verses.length - 1]!)}`);
              }
              verseOpen = true;
            }
            if (petuchaPending) {
              petuchaBefore.push(words.length);
              petuchaPending = false;
            }
            if (gapPending) {
              gapBefore.push(words.length);
              gapPending = false;
            }
            words.push(tok);
            wordVerse.push(verses.length - 1);
          }
          if (endsVerse) verseOpen = false;
        }
      });
      if (queue.length > 0) {
        missingVerseRefs++;
        if (problems.length < 20) problems.push(`p${page} l${li + 1}: leftover verse references ${queue.map(fmt).join(", ")}`);
      }
      for (const mark of line.aliyot) {
        for (const [kind, n] of Object.entries(mark)) {
          aliyahMarks.push({ page, line: li + 1, kind, n, verseStarts: verseStartsHere });
        }
      }
      lines.push({
        start: lineStart,
        end: words.length - 1,
        text: runs.join(" ").replace(/\s+/g, " ").trim(),
        petucha: line.isPetucha,
        gap: lineHadGap,
      });
    });

    columns.push({ n: page, startWord: colStart, endWord: words.length - 1, lines });
  }

  // --- parashot and aliyot from hebcal, cross-checked with tikkun.io marks ---
  const verseIndex = new Map<string, number>();
  verses.forEach((v, i) => verseIndex.set(`${v.book}:${v.chapter}:${v.verse}`, i));
  const startOf = (r: VerseRef): number => {
    const i = verseIndex.get(`${r.book}:${r.chapter}:${r.verse}`);
    if (i === undefined) throw new Error(`verse not found in text: ${fmt(r)}`);
    return verses[i]!.start;
  };
  const endOf = (r: VerseRef): number => {
    const i = verseIndex.get(`${r.book}:${r.chapter}:${r.verse}`);
    if (i === undefined) throw new Error(`verse not found in text: ${fmt(r)}`);
    const next = verses[i + 1];
    return next ? next.start - 1 : words.length - 1;
  };

  // tikkun.io "standard" marks grouped by parashah: 1..7 are the aliyot, 8 is maftir
  type Mark = (typeof aliyahMarks)[number];
  const markGroups: Array<Map<number, Mark>> = [];
  for (const m of aliyahMarks) {
    if (m.kind !== "standard") continue;
    const n = Number(m.n);
    if (n === 1) markGroups.push(new Map());
    const group = markGroups[markGroups.length - 1];
    if (!group) continue;
    group.set(n, m);
  }
  let aliyahDisagreements = 0;
  let aliyahUnmarked = 0;
  const parashot: ParashotData = PARASHOT.map(([en, es], idx) => {
    const ley = getLeyningForParsha(en);
    if (!ley || !ley.fullkriyah) throw new Error(`hebcal returned no reading for ${en}`);
    const group = markGroups[idx] ?? new Map<number, Mark>();
    const aliyot: ParashotData[number]["aliyot"] = [];
    for (const key of ["1", "2", "3", "4", "5", "6", "7", "M"] as const) {
      const a = ley.fullkriyah[key];
      if (!a) {
        // hebcal has no maftir for Vezot Haberakhah: it is read on Simchat Torah with a different structure
        if (key === "M") continue;
        throw new Error(`missing aliyah ${key} in ${en}`);
      }
      const start = parseRef(a.k, a.b);
      const end = parseRef(a.k, a.e);
      aliyot.push({ n: key === "M" ? "M" : Number(key), startWord: startOf(start), endWord: endOf(end), start, end });
      const mark = group.get(key === "M" ? 8 : Number(key));
      if (!mark) {
        aliyahUnmarked++;
        continue;
      }
      const agrees = mark.verseStarts.some((vi) => sameRef(verses[vi]!, start));
      if (!agrees) {
        aliyahDisagreements++;
        const where = `p${mark.page} l${mark.line} (${mark.verseStarts.map((vi) => fmt(verses[vi]!)).join(", ") || "no verse start"})`;
        if (problems.length < 60) problems.push(`${en} aliyah ${key}: hebcal ${fmt(start)}, tikkun.io ${where}`);
      }
    }
    const first = aliyot[0]!;
    const seventh = aliyot[6]!;
    return {
      n: idx + 1,
      name: { en, he: ley.name.he, es },
      book: first.start.book,
      startWord: first.startWord,
      endWord: seventh.endWord,
      start: first.start,
      end: seventh.end,
      aliyot,
    };
  });

  // parashot must be contiguous
  for (let i = 1; i < parashot.length; i++) {
    const prev = parashot[i - 1]!;
    const cur = parashot[i]!;
    if (cur.startWord !== prev.endWord + 1) {
      problems.push(`parashah ${cur.name.en} starts at word ${cur.startWord} but ${prev.name.en} ends at ${prev.endWord}`);
    }
  }
  const last = parashot[parashot.length - 1]!;
  if (last.endWord !== words.length - 1) problems.push(`last parashah ends at ${last.endWord}, text ends at ${words.length - 1}`);

  // --- hard checks ---
  const errors: string[] = [];
  if (columns.length !== 245) errors.push(`columns: ${columns.length}`);
  if (words.some((w) => !/^[א-ת]+$/.test(w))) errors.push("some words contain characters outside the Hebrew alphabet");
  if (markGroups.length !== 54) errors.push(`tikkun.io aliyah mark groups: ${markGroups.length}, expected 54`);
  if (words[0] !== "בראשית") errors.push(`first word: ${words[0]}`);
  if (words[words.length - 1] !== "ישראל") errors.push(`last word: ${words[words.length - 1]}`);
  if (parashot.length !== 54) errors.push(`parashot: ${parashot.length}`);
  if (errors.length > 0) {
    console.error("ERRORS:\n - " + errors.join("\n - "));
    process.exit(1);
  }

  const torah: TorahData = {
    source: { repo: "https://github.com/akivajgordon/tikkun.io", commit },
    wordCount: words.length,
    words,
    wordVerse,
    verses,
    petuchaBefore,
    gapBefore,
  };
  const layout: LayoutData = { columns };

  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "torah.json"), JSON.stringify(torah));
  fs.writeFileSync(path.join(DIST, "layout-245.json"), JSON.stringify(layout));
  fs.writeFileSync(path.join(DIST, "parashot.json"), JSON.stringify(parashot, null, 1));

  const uniqueForms = new Set(words).size;
  const lineCounts = columns.map((c) => c.lines.length);
  console.log(`words: ${words.length} | unique forms: ${uniqueForms} | verses: ${verses.length}`);
  console.log(`petuchot: ${petuchaBefore.length} | in-line gaps: ${gapBefore.length}`);
  console.log(`columns: ${columns.length} | lines per column: min ${Math.min(...lineCounts)} max ${Math.max(...lineCounts)}`);
  console.log(`verses misplaced per ToC: ${placementMismatches} | leftover references: ${missingVerseRefs} | internal sof pasuk: ${internalSofPasuk}`);
  console.log(`aliyot where hebcal and tikkun.io disagree: ${aliyahDisagreements} | aliyot unmarked in tikkun.io: ${aliyahUnmarked}`);
  if (problems.length > 0) {
    console.log("\nNotes:");
    for (const p of problems) console.log(" - " + p);
  }
  const sizes = ["torah.json", "layout-245.json", "parashot.json"].map((f) => `${f} ${(fs.statSync(path.join(DIST, f)).size / 1e6).toFixed(2)} MB`);
  console.log("\n" + sizes.join(" | "));
}

main();
