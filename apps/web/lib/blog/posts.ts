/** Blog posts: one entry per post, in the order the index shows them. Slugs are shared by both languages. */
import type { Locale } from "@/lib/i18n";

export type PostSlug = "halacha" | "how-it-works" | "about" | "story";

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
    minutes: 9,
    title: {
      es: "Preparar el sefer antes de Shabat: la halajá y las fuentes",
      en: "Preparing the sefer before Shabbat: the halacha and the sources",
    },
    description: {
      es: "NavTorá es para dejar el rollo listo antes de Shabat y de Iom Tov, no para usarla en Shabat. Por qué preparar el rollo antes, y por qué el teléfono queda afuera, con las fuentes.",
      en: "NavTorah is for getting the scroll ready before Shabbat and Yom Tov, not for use on Shabbat. Why prepare the scroll beforehand, and why the phone stays out, with the sources.",
    },
  },
  {
    slug: "how-it-works",
    date: "2026-10-14",
    minutes: 10,
    title: {
      es: "De una foto a la columna exacta",
      en: "From a photo to the exact column",
    },
    description: {
      es: "Seguimos una foto real de un sefer, paso a paso: cómo la app separa la tinta del pergamino, encuentra los renglones, los lee y los ubica entre las 80.316 palabras de la Torá.",
      en: "We follow one real photo of a sefer, step by step: how the app separates ink from parchment, finds the lines, reads them and places them among the Torah's 80,316 words.",
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
