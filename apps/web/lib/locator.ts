/** One locator per server instance: loads the @navtora/data files once and builds the index in memory. */
import "server-only";
import { createLocator, type LayoutData, type Locator, type ParashotData, type TorahData } from "@navtora/core";
import torahJson from "@navtora/data/dist/torah.json";
import layoutJson from "@navtora/data/dist/layout-245.json";
import parashotJson from "@navtora/data/dist/parashot.json";

let instance: Locator | null = null;

export function getLocator(): Locator {
  if (!instance) {
    instance = createLocator(
      {
        torah: torahJson as unknown as TorahData,
        layout: layoutJson as unknown as LayoutData,
        parashot: parashotJson as unknown as ParashotData,
      },
      // debug keeps the per-line alignment, which navigation uses to name the starting line
      { debug: true },
    );
  }
  return instance;
}

export function getLayout(): LayoutData {
  return layoutJson as unknown as LayoutData;
}

export function getParashot(): ParashotData {
  return parashotJson as unknown as ParashotData;
}
