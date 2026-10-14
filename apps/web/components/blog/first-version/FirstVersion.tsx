import type { Locale } from "@/lib/i18n";
import { PrepareNote } from "../PrepareNote";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";

/** "NavTorah's first version": the MVP, which read the column with Claude through the Anthropic API. */
export function FirstVersion({ lang }: { lang: Locale }) {
  return (
    <article className="mx-auto mt-10 max-w-3xl px-5 sm:px-6">
      <PrepareNote lang={lang} className="mb-10" />
      <div className="prose-blog">{lang === "es" ? contentEs : contentEn}</div>
    </article>
  );
}
