/**
 * Carga de los datos generados en dist/. Para Node (scripts, tests, eval).
 * La app web importa los JSON directamente con el bundler.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LayoutData, ParashotData, TorahData } from "@kore/core";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DIST_DIR = path.resolve(here, "../dist");

export interface KoreData {
  torah: TorahData;
  layout: LayoutData;
  parashot: ParashotData;
}

function readJson<T>(name: string): T {
  const p = path.join(DIST_DIR, name);
  if (!fs.existsSync(p)) {
    throw new Error(`No existe ${p}. Corré "pnpm build:data" primero.`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

let cache: KoreData | null = null;

export function loadDataNode(): KoreData {
  if (!cache) {
    cache = {
      torah: readJson<TorahData>("torah.json"),
      layout: readJson<LayoutData>("layout-245.json"),
      parashot: readJson<ParashotData>("parashot.json"),
    };
  }
  return cache;
}
