import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";
import { PrepareNote } from "../PrepareNote";
import { SourceCard } from "./SourceCard";
import { SOURCES } from "./sources";

export interface HalachaContent {
  intro: ReactNode;
  /** prose, then the cards of the sources it introduces, by id */
  sections: Array<{ id: string; text: ReactNode; sources: string[] }>;
  outro: ReactNode;
}

/** "What to do when no one can read Torah": the Conservative responsum on it, where the app helps, and the sources. */
export function Halacha({ lang }: { lang: Locale }) {
  const c = lang === "es" ? contentEs : contentEn;
  return (
    <article className="mx-auto mt-10 max-w-3xl px-5 sm:px-6">
      <PrepareNote lang={lang} className="mb-10" />
      <div className="prose-blog">{c.intro}</div>
      {c.sections.map((section) => (
        <section key={section.id} id={section.id} className="mt-16 scroll-mt-20">
          <div className="prose-blog">{section.text}</div>
          {section.sources.length > 0 && (
            <div className="mt-8 grid gap-4">
              {section.sources.map((id) => {
                const s = SOURCES.find((x) => x.id === id);
                return s ? <SourceCard key={id} source={s} lang={lang} /> : null;
              })}
            </div>
          )}
        </section>
      ))}
      <div className="prose-blog mt-16">{c.outro}</div>
    </article>
  );
}
