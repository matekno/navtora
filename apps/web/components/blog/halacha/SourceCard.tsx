import type { Locale } from "@/lib/i18n";

export interface Source {
  id: string;
  /** title in the reader's language */
  title: Record<Locale, string>;
  /** the title as published, when it isn't in the reader's language (Hebrew, English…) */
  original?: string;
  /** who wrote it, for which body, its number and its vote */
  cite: Record<Locale, string>;
  year?: string;
  /** what it says, when the post's text doesn't already tell it */
  summary?: Record<Locale, string>;
  /** what it means for using the app, if it says something specific */
  relevance?: Record<Locale, string>;
  /** where to read it: the label names the site or document, e.g. "Sefaria", "PDF en castellano" */
  links: Array<{ label: Record<Locale, string> | string; url: string }>;
}

const LABEL: Record<Locale, string> = { es: "Responsa del CJLS", en: "CJLS responsum" };

export function SourceCard({ source: s, lang }: { source: Source; lang: Locale }) {
  return (
    <article id={s.id} className="scroll-mt-20 rounded-2xl border border-accent/50 bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-accent/60 px-2 py-0.5 font-medium text-accent">{LABEL[lang]}</span>
        {s.year && <span className="text-muted">{s.year}</span>}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-fg">{s.title[lang]}</h3>
      {s.original && s.original !== s.title[lang] && (
        <p className={`mt-0.5 text-sm text-muted ${/[֐-׿]/.test(s.original) ? "he" : "italic"}`}>{s.original}</p>
      )}
      <p className="mt-1 text-sm text-muted">{s.cite[lang]}</p>
      {s.summary && <p className="mt-3 leading-relaxed text-fg/85">{s.summary[lang]}</p>}
      {s.relevance && (
        <p className="mt-3 border-s-2 border-line ps-3 text-[15px] leading-relaxed text-muted">
          <span className="font-medium text-fg/80">{lang === "es" ? "Para la app: " : "For the app: "}</span>
          {s.relevance[lang]}
        </p>
      )}
      {s.links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {s.links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              {typeof l.label === "string" ? l.label : l.label[lang]} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
