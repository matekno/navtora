/**
 * Downloads openly licensed scanned sifrei Torah to tools/eval/data/scans/
 * (never committed). Resumes partial downloads and skips finished ones.
 *
 *   pnpm --filter @navtora/eval download -- [shannon|kokhav|makhonot|bl1462|all] [--pages]
 *
 * --pages: for the Wikimedia Commons PDFs, fetch one thumbnail per page
 * straight into data/columns/<set>/ (what `split` would produce) instead of
 * the original PDF. Commons rate-limits downloads of originals from busy
 * addresses, such as cloud machines, but serves standard thumbnail sizes.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCANS_DIR = path.resolve(here, "../data/scans");
const COLUMNS_DIR = path.resolve(here, "../data/columns");

interface Source {
  set: string;
  file: string;
  /** direct URL, or "commons:File:..." to resolve through the Wikimedia Commons API */
  url: string;
  license: string;
  note: string;
  /** page count of a Commons PDF, for --pages (Commons answers past the last page with the last page) */
  pages?: number;
}

export const SOURCES: Source[] = [
  {
    set: "shannon",
    file: "shannon-2a.pdf",
    url: "commons:File:Sefer-Torah-Elihu-Shannon-2a.pdf",
    pages: 111,
    license: "CC BY-SA 3.0",
    note: "Sefer by Elihu Shannon, Kibbutz Sa'ad, 2011. Standard 245 x 42 layout. First half.",
  },
  {
    set: "shannon",
    file: "shannon-2b.pdf",
    url: "commons:File:Sefer-Torah-Elihu-Shannon-2b.pdf",
    pages: 135,
    license: "CC BY-SA 3.0",
    note: "Second half of the same sefer.",
  },
  {
    set: "kokhav",
    file: "kokhav.pdf",
    url: "commons:File:David-kokhav-sefer-torah.pdf",
    pages: 226,
    license: "CC BY-SA 3.0",
    note: "Sefer by David Kokhav, 226 columns, Yemenite conventions. High resolution.",
  },
  {
    set: "makhonot",
    file: "makhonot-18157.pdf",
    url: "https://archive.org/download/torah-scroll-germany-ca.-1920s-refurbished-makhon-ot-no.-18157/Torah%20Scroll%20%28Germany%20ca.%201920s%2C%20refurbished%20Makhon%20Ot%20no.%2018157%29.pdf",
    license: "CC0",
    note: "German sefer, ca. 1920, restored by Makhon Ot, 190 columns, non-standard layout.",
  },
  {
    set: "bl1462",
    file: "bl-or-1462-images.zip",
    url: "https://archive.org/download/sefer-torah-bl-or-1462-images/Sefer_Torah_BL_Or_1462_images.zip",
    license: "Public domain",
    note: "British Library Or. 1462, 15th century, Oriental script, real wear.",
  },
];

// Wikimedia asks for a user agent that identifies the tool and how to reach its authors
const USER_AGENT = "NavTorahEval/0.1 (https://github.com/matekno/navtora; research on locating text in Torah scrolls)";

/** fetch that waits and retries when the server says it is busy (429, 503), as Wikimedia often does. */
async function politeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = { "user-agent": USER_AGENT, ...(init.headers as Record<string, string> | undefined) };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...init, headers });
    if ((res.status !== 429 && res.status !== 503) || attempt >= 6) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt;
    console.log(`  … ${res.status}, retrying in ${Math.round(wait / 1000)} s`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

async function resolveCommons(title: string): Promise<string> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  const res = await politeFetch(api);
  if (!res.ok) throw new Error(`Commons API ${res.status} for ${title}`);
  const json = (await res.json()) as { query: { pages: Record<string, { imageinfo?: Array<{ url: string }> }> } };
  const page = Object.values(json.query.pages)[0];
  const url = page?.imageinfo?.[0]?.url;
  if (!url) throw new Error(`Commons returned no URL for ${title}`);
  return url;
}

async function download(src: Source): Promise<void> {
  const dir = path.join(SCANS_DIR, src.set);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, src.file);
  const partial = dest + ".part";
  if (fs.existsSync(dest)) {
    console.log(`✓ ${src.set}/${src.file} already present (${(fs.statSync(dest).size / 1e6).toFixed(0)} MB)`);
    return;
  }
  const url = src.url.startsWith("commons:") ? await resolveCommons(src.url.slice("commons:".length)) : src.url;
  const have = fs.existsSync(partial) ? fs.statSync(partial).size : 0;
  const headers: Record<string, string> = {};
  if (have > 0) headers.range = `bytes=${have}-`;
  console.log(`↓ ${src.set}/${src.file}${have ? ` (resuming from ${(have / 1e6).toFixed(0)} MB)` : ""}`);
  const res = await politeFetch(url, { headers, redirect: "follow" });
  if (!(res.status === 200 || res.status === 206) || !res.body) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const append = res.status === 206 && have > 0;
  const out = fs.createWriteStream(partial, { flags: append ? "a" : "w" });
  await pipeline(Readable.fromWeb(res.body as never), out);
  fs.renameSync(partial, dest);
  console.log(`✓ ${src.set}/${src.file} (${(fs.statSync(dest).size / 1e6).toFixed(0)} MB) — ${src.license}`);
}

/** Commons serves thumbnails of each PDF page at standard widths; 1920 is one of them. */
const THUMB_WIDTH = 1920;
/** the long edge the eval works at, as `split` produces */
const COLUMN_EDGE = 1800;

/** Thumbnail URL of a page of a Commons file; the path comes from the MD5 of the file name. */
function commonsPageUrl(title: string, page: number): string {
  const name = title.replace(/^File:/, "").replace(/ /g, "_");
  const md5 = createHash("md5").update(name).digest("hex");
  const n = encodeURIComponent(name);
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${n}/page${page}-${THUMB_WIDTH}px-${n}.jpg`;
}

async function commonsPageCount(title: string): Promise<number> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=size&format=json`;
  const res = await politeFetch(api);
  if (!res.ok) throw new Error(`Commons API ${res.status} for ${title}`);
  const json = (await res.json()) as { query: { pages: Record<string, { imageinfo?: Array<{ pagecount?: number }> }> } };
  const n = Object.values(json.query.pages)[0]?.imageinfo?.[0]?.pagecount;
  if (!n) throw new Error(`Commons returned no page count for ${title}`);
  return n;
}

/** Fetches every page of a Commons PDF as a column image, numbered from `offset + 1`. Returns the page count. */
async function downloadPages(src: Source, offset: number): Promise<number> {
  const dir = path.join(COLUMNS_DIR, src.set);
  fs.mkdirSync(dir, { recursive: true });
  const title = src.url.slice("commons:".length);
  const pages = src.pages ?? (await commonsPageCount(title));
  for (let page = 1; page <= pages; page++) {
    const dest = path.join(dir, `${String(offset + page).padStart(3, "0")}.jpg`);
    if (fs.existsSync(dest)) continue;
    const res = await politeFetch(commonsPageUrl(title, page));
    if (!res.ok) throw new Error(`HTTP ${res.status} for page ${page} of ${title}`);
    const img = Buffer.from(await res.arrayBuffer());
    await sharp(img).resize({ width: COLUMN_EDGE, height: COLUMN_EDGE, fit: "inside" }).jpeg({ quality: 88 }).toFile(dest);
    if (page % 20 === 0) console.log(`  ${src.set}/${src.file}: ${page} pages`);
    await new Promise((r) => setTimeout(r, 200)); // be gentle
  }
  console.log(`✓ ${src.set}/${src.file}: ${pages} pages in ${path.relative(process.cwd(), dir)} — ${src.license}`);
  return pages;
}

async function main(): Promise<void> {
  const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const sets = wanted.length === 0 || wanted.includes("all") ? null : new Set(wanted);
  const todo = SOURCES.filter((s) => !sets || sets.has(s.set));
  fs.mkdirSync(SCANS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(SCANS_DIR, "SOURCES.md"),
    "# Scan sources\n\n" + SOURCES.map((s) => `- **${s.set}/${s.file}** — ${s.note} License: ${s.license}. Source: ${s.url}`).join("\n") + "\n",
  );
  const pagesMode = process.argv.includes("--pages");
  const pagesSoFar = new Map<string, number>(); // per set, so files of one set number on
  for (const src of todo) {
    try {
      if (pagesMode && src.url.startsWith("commons:")) {
        const offset = pagesSoFar.get(src.set) ?? 0;
        pagesSoFar.set(src.set, offset + (await downloadPages(src, offset)));
      } else {
        await download(src);
      }
    } catch (err) {
      console.error(`✗ ${src.set}/${src.file}: ${(err as Error).message}`);
    }
  }
}

main();
