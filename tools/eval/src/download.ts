/**
 * Baja los sifrei digitalizados con licencia abierta a tools/eval/data/scans/.
 * Nunca se suben al repo. Reanuda descargas incompletas y no repite las hechas.
 *
 *   pnpm --filter @kore/eval download -- [shannon|kokhav|makhonot|bl1462|all]
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
  /** URL directa, o "commons:File:..." para resolver vía la API de Wikimedia Commons */
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
    note: "Sefer de Elihu Shannon, Kibutz Saad, 2011. Layout estándar 245 x 42. Primera mitad.",
  },
  {
    set: "shannon",
    file: "shannon-2b.pdf",
    url: "commons:File:Sefer-Torah-Elihu-Shannon-2b.pdf",
    license: "CC BY-SA 3.0",
    note: "Segunda mitad del mismo sefer.",
  },
  {
    set: "kokhav",
    file: "kokhav.pdf",
    url: "commons:File:David-kokhav-sefer-torah.pdf",
    license: "CC BY-SA 3.0",
    note: "Sefer de David Kokhav, 226 columnas, convenciones yemenitas. Alta resolución.",
  },
  {
    set: "makhonot",
    file: "makhonot-18157.pdf",
    url: "https://archive.org/download/torah-scroll-germany-ca.-1920s-refurbished-makhon-ot-no.-18157/Torah%20Scroll%20%28Germany%20ca.%201920s%2C%20refurbished%20Makhon%20Ot%20no.%2018157%29.pdf",
    license: "CC0",
    note: "Sefer alemán ca. 1920 restaurado por Makhon Ot, 190 columnas, layout no estándar.",
  },
  {
    set: "bl1462",
    file: "bl-or-1462-images.zip",
    url: "https://archive.org/download/sefer-torah-bl-or-1462-images/Sefer_Torah_BL_Or_1462_images.zip",
    license: "Dominio público",
    note: "British Library Or. 1462, siglo XV, escritura oriental, desgaste real.",
  },
];

async function resolveCommons(title: string): Promise<string> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetch(api, { headers: { "user-agent": "kore-kompanion-eval/0.1 (research; contact: repo owner)" } });
  if (!res.ok) throw new Error(`Commons API ${res.status} para ${title}`);
  const json = (await res.json()) as { query: { pages: Record<string, { imageinfo?: Array<{ url: string }> }> } };
  const page = Object.values(json.query.pages)[0];
  const url = page?.imageinfo?.[0]?.url;
  if (!url) throw new Error(`Commons no devolvió URL para ${title}`);
  return url;
}

async function download(src: Source): Promise<void> {
  const dir = path.join(SCANS_DIR, src.set);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, src.file);
  const partial = dest + ".part";
  if (fs.existsSync(dest)) {
    console.log(`✓ ${src.set}/${src.file} ya está (${(fs.statSync(dest).size / 1e6).toFixed(0)} MB)`);
    return;
  }
  const url = src.url.startsWith("commons:") ? await resolveCommons(src.url.slice("commons:".length)) : src.url;
  const have = fs.existsSync(partial) ? fs.statSync(partial).size : 0;
  const headers: Record<string, string> = { "user-agent": "kore-kompanion-eval/0.1 (research; contact: repo owner)" };
  if (have > 0) headers.range = `bytes=${have}-`;
  console.log(`↓ ${src.set}/${src.file}${have ? ` (reanudando desde ${(have / 1e6).toFixed(0)} MB)` : ""}`);
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!(res.status === 200 || res.status === 206) || !res.body) throw new Error(`HTTP ${res.status} bajando ${url}`);
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
    "# Fuentes de los escaneos\n\n" + SOURCES.map((s) => `- **${s.set}/${s.file}** — ${s.note} Licencia: ${s.license}. Origen: ${s.url}`).join("\n") + "\n",
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
