import type { Locale } from "@/lib/i18n";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";

/** "About me": who makes NavTorah. */
export function About({ lang }: { lang: Locale }) {
  return (
    <article className="mx-auto mt-10 max-w-3xl px-5 sm:px-6">
      {/* flow-root keeps the floated photos inside the article */}
      <div className="prose-blog prose-prints flow-root">{lang === "es" ? contentEs : contentEn}</div>
    </article>
  );
}
