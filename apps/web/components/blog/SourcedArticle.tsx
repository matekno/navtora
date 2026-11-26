import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { SourceCard, type Source } from "./SourceCard";

export interface SourcedContent {
  intro: ReactNode;
  /** prose, then the cards of the sources it introduces, by id */
  sections: Array<{ id: string; text: ReactNode; sources: string[] }>;
  outro?: ReactNode;
}

/** A post that summarizes sources and links to them: prose by sections, each followed by its source cards. */
export function SourcedArticle({ content: c, sources, lang, before }: { content: SourcedContent; sources: Source[]; lang: Locale; before?: ReactNode }) {
  return (
    <article className="mx-auto mt-10 max-w-3xl px-5 sm:px-6">
      {before}
      <div className="prose-blog">{c.intro}</div>
      {c.sections.map((section) => (
        <section key={section.id} id={section.id} className="mt-16 scroll-mt-20">
          <div className="prose-blog">{section.text}</div>
          {section.sources.length > 0 && (
            <div className="mt-8 grid gap-4">
              {section.sources.map((id) => {
                const s = sources.find((x) => x.id === id);
                return s ? <SourceCard key={id} source={s} lang={lang} /> : null;
              })}
            </div>
          )}
        </section>
      ))}
      {c.outro && <div className="prose-blog mt-16">{c.outro}</div>}
    </article>
  );
}
