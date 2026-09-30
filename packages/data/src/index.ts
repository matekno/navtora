/**
 * Loads the generated data in dist/ for Node (scripts, tests, eval).
 * The web app imports the JSON directly through the bundler.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LayoutData, ParashotData, TorahData } from "@navtora/core";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DIST_DIR = path.resolve(here, "../dist");

export interface NavToraData {
  torah: TorahData;
  layout: LayoutData;
  parashot: ParashotData;
}

function readJson<T>(name: string): T {
  const p = path.join(DIST_DIR, name);
  if (!fs.existsSync(p)) {
    throw new Error(`${p} not found. Run "pnpm build:data" first.`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

let cache: NavToraData | null = null;

export function loadDataNode(): NavToraData {
  if (!cache) {
    cache = {
      torah: readJson<TorahData>("torah.json"),
      layout: readJson<LayoutData>("layout-245.json"),
      parashot: readJson<ParashotData>("parashot.json"),
    };
  }
  return cache;
}
