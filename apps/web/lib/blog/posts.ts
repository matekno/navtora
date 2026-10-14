/** Blog posts: one entry per post, in the order the index shows them. Slugs are shared by both languages. */
import type { Locale } from "@/lib/i18n";

export type PostSlug = "halacha" | "how-it-works" | "training" | "first-version" | "about" | "story";

export interface PostMeta {
  slug: PostSlug;
  /** ISO date of the last substantial update; null while the post is unwritten */
  date: string | null;
  /** reading time in minutes */
  minutes: number | null;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const POSTS: PostMeta[] = [
  {
    slug: "halacha",
    date: "2026-10-14",
    minutes: 7,
    title: {
      es: "Qué hacer cuando nadie sabe leer la Torá",
      en: "What to do when no one can read Torah",
    },
    description: {
      es: "La halajá pide no dejar la lectura de la Torá aunque nadie la sepa leer bien. Qué dice la responsa conservadora de 2026 y cómo ayuda NavTorá a leer del rollo.",
      en: "The halacha asks not to drop the Torah reading even when no one can read it well. What the 2026 Conservative responsum says, and how NavTorah helps read from the scroll.",
    },
  },
  {
    slug: "how-it-works",
    date: "2026-10-14",
    minutes: 11,
    title: {
      es: "Cómo NavTorá sabe en qué columna está abierto el sefer",
      en: "How NavTorah knows which column the sefer is open at",
    },
    description: {
      es: "Seguimos paso a paso una foto real de un sefer, desde que la app separa la tinta del pergamino hasta que ubica la columna entre las 80.316 palabras de la Torá.",
      en: "We follow one real photo of a sefer step by step, from separating the ink from the parchment to placing the column among the Torah's 80,316 words.",
    },
  },
  {
    slug: "training",
    date: "2026-10-14",
    minutes: 8,
    title: {
      es: "Cómo entrenamos la red que lee el sefer",
      en: "How we trained the network that reads the sefer",
    },
    description: {
      es: "Las fotos sintéticas con las que aprendió a leer, las fuentes, y cómo la probamos con cuatro sifrei reales que nunca vio, entre ellos uno del siglo XV.",
      en: "The synthetic photos it learned to read from, the fonts, and how we tested it on four real sifrei it had never seen, one of them from the 15th century.",
    },
  },
  {
    slug: "first-version",
    date: "2026-10-14",
    minutes: 5,
    title: {
      es: "La primera versión de NavTorá, con la API de Anthropic",
      en: "NavTorah's first version, with the Anthropic API",
    },
    description: {
      es: "Cómo leía las columnas Claude en el MVP, cuánto tardaba y costaba, y por qué pasamos a una red propia en el teléfono.",
      en: "How Claude read the columns in the MVP, how long it took and what it cost, and why we moved to our own network on the phone.",
    },
  },
  {
    slug: "about",
    date: null,
    minutes: null,
    title: { es: "Sobre mí", en: "About me" },
    description: { es: "Quién hace NavTorá.", en: "Who makes NavTorah." },
  },
  {
    slug: "story",
    date: null,
    minutes: null,
    title: { es: "Por qué hice NavTorá", en: "Why I made NavTorah" },
    description: { es: "La historia detrás de la app.", en: "The story behind the app." },
  },
];

export function getPost(slug: string): PostMeta | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}
