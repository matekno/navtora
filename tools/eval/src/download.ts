/**
 * Downloads openly licensed scanned sifrei Torah to tools/eval/data/scans/
 * (never committed). Resumes partial downloads and skips finished ones.
 *
 *   pnpm --filter @navtora/eval download -- [shannon|kokhav|makhonot|bl1462|all]
 */
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCANS_DIR = path.resolve(here, "../data/scans");

interface Source {
  set: string;
  file: string;
  /** direct URL, or "commons:File:..." to resolve through the Wikimedia Commons API */
  url: string;
  license: string;
  note: string;
}

export const SOURCES: Source[] = [
  {
    set: "shannon",
    file: "shannon-2a.pdf",
    url: "commons:File:Sefer-Torah-Elihu-Shannon-2a.pdf",
    license: "CC BY-SA 3.0",
    note: "Sefer by Elihu Shannon, Kibbutz Sa'ad, 2011. Standard 245 x 42 layout. First half.",
  },
  {
    set: "shannon",
    file: "shannon-2b.pdf",
    url: "commons:File:Sefer-Torah-Elihu-Shannon-2b.pdf",
    license: "CC BY-SA 3.0",
    note: "Second half of the same sefer.",
  },
  {
    set: "kokhav",
    file: "kokhav.pdf",
    url: "commons:File:David-kokhav-sefer-torah.pdf",
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

async function resolveCommons(title: string): Promise<string> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetch(api, { headers: { "user-agent": "navtora-eval/0.1 (research; contact: repo owner)" } });
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
  const headers: Record<string, string> = { "user-agent": "navtora-eval/0.1 (research; contact: repo owner)" };
  if (have > 0) headers.range = `bytes=${have}-`;
  console.log(`↓ ${src.set}/${src.file}${have ? ` (resuming from ${(have / 1e6).toFixed(0)} MB)` : ""}`);
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!(res.status === 200 || res.status === 206) || !res.body) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const append = res.status === 206 && have > 0;
  const out = fs.createWriteStream(partial, { flags: append ? "a" : "w" });
  await pipeline(Readable.fromWeb(res.body as never), out);
  fs.renameSync(partial, dest);
  console.log(`✓ ${src.set}/${src.file} (${(fs.statSync(dest).size / 1e6).toFixed(0)} MB) — ${src.license}`);
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
  for (const src of todo) {
    try {
      await download(src);
    } catch (err) {
      console.error(`✗ ${src.set}/${src.file}: ${(err as Error).message}`);
    }
  }
}

main();
