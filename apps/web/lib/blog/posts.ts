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
      es: "Por qué NavTorá se usa antes de Shabat",
      en: "Why NavTorah is used before Shabbat",
    },
    description: {
      es: "NavTorá se usa la víspera de Shabat y de Iom Tov para dejar el rollo listo. Acá están las fuentes sobre preparar el rollo antes y sobre por qué el celular no se usa en Shabat.",
      en: "NavTorah is used the day before Shabbat and Yom Tov to get the scroll ready. Here are the sources on preparing the scroll beforehand and on why phones aren't used on Shabbat.",
    },
  },
  {
    slug: "how-it-works",
    date: "2026-10-14",
    minutes: 10,
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
