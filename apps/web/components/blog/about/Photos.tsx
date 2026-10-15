/** Photos of the about post, in public/blog/about/. */
import type { PrintPhoto } from "../Prints";

export const ABOUT = {
  retrato: { src: "/blog/about/retrato.webp", width: 768, height: 1152 },
  servicio: { src: "/blog/about/servicio.webp", width: 1280, height: 960 },
  caja: { src: "/blog/about/caja.webp", width: 1280, height: 960 },
  campo: { src: "/blog/about/campo.webp", width: 1000, height: 563 },
  rab: { src: "/blog/about/rab.webp", width: 1280, height: 714 },
} satisfies Record<string, PrintPhoto>;
