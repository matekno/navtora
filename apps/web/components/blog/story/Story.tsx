import type { Locale } from "@/lib/i18n";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";

/** "Why I made NavTorah": the author's story, from his Bar Mitzvah to Iamim Noraim in Formosa. */
export function Story({ lang }: { lang: Locale }) {
  return (
    <article className="mx-auto mt-10 max-w-3xl px-5 sm:px-6">
      {/* flow-root keeps the floated photos inside the article */}
      <div className="prose-blog prose-prints flow-root">{lang === "es" ? contentEs : contentEn}</div>
    </article>
  );
}
