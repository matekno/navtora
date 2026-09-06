/**
 * Locator único del servidor. Carga los datos generados por @kore/data una sola
 * vez por instancia y construye el índice en memoria.
 */
import "server-only";
import { createLocator, type LayoutData, type Locator, type ParashotData, type TorahData } from "@kore/core";
import torahJson from "@kore/data/dist/torah.json";
import layoutJson from "@kore/data/dist/layout-245.json";
import parashotJson from "@kore/data/dist/parashot.json";

let instance: Locator | null = null;

export function getLocator(): Locator {
  if (!instance) {
    instance = createLocator({
      torah: torahJson as unknown as TorahData,
      layout: layoutJson as unknown as LayoutData,
      parashot: parashotJson as unknown as ParashotData,
    });
  }
  return instance;
}

export function getLayout(): LayoutData {
  return layoutJson as unknown as LayoutData;
}
