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
    instance = createLocator(
      {
        torah: torahJson as unknown as TorahData,
        layout: layoutJson as unknown as LayoutData,
        parashot: parashotJson as unknown as ParashotData,
      },
      // debug para tener la alineación por línea, que la navegación usa para decir en qué línea empieza la lectura
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
