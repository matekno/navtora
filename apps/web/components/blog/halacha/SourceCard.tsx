import type { Locale } from "@/lib/i18n";

export type Stance = "reading" | "responsum" | "dissent" | "purpose";

export interface Source {
  id: string;
  stance: Stance;
  /** title in the reader's language */
  title: Record<Locale, string>;
  /** the title as published, when it isn't in the reader's language (Hebrew, English…) */
  original?: string;
  /** "Shulján Aruj, Óraj Jaim 144:3"; for a responsum, who wrote it and for which body */
  cite: Record<Locale, string>;
  year?: string;
  summary: Record<Locale, string>;
  /** what it means for using the app, if it says something specific */
  relevance?: Record<Locale, string>;
  /** where to read it: the label names the site or document, e.g. "Sefaria", "PDF en castellano" */
  links: Array<{ label: Record<Locale, string> | string; url: string }>;
}

const STANCE: Record<Stance, Record<Locale, string>> = {
  reading: { es: "Cuando nadie sabe leer", en: "When no one can read" },
  responsum: { es: "Responsa conservadora", en: "Conservative responsum" },
  dissent: { es: "Disenso", en: "Dissent" },
  purpose: { es: "Preparar el rollo", en: "Preparing the scroll" },
};

const STANCE_STYLE: Record<Stance, string> = {
  reading: "border-line text-muted",
  responsum: "border-accent/60 text-accent",
  dissent: "border-line text-muted",
  purpose: "border-ok/50 text-ok",
};

export function SourceCard({ source: s, lang }: { source: Source; lang: Locale }) {
  return (
    <article id={s.id} className={`scroll-mt-20 rounded-2xl border bg-panel p-5 sm:p-6 ${s.stance === "responsum" ? "border-accent/50" : "border-line/70"}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full border px-2 py-0.5 font-medium ${STANCE_STYLE[s.stance]}`}>{STANCE[s.stance][lang]}</span>
        {s.year && <span className="text-muted">{s.year}</span>}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-fg">{s.title[lang]}</h3>
      {s.original && s.original !== s.title[lang] && (
        <p className={`mt-0.5 text-sm text-muted ${/[֐-׿]/.test(s.original) ? "he" : "italic"}`}>{s.original}</p>
      )}
      <p className="mt-1 text-sm text-muted">{s.cite[lang]}</p>
      <p className="mt-3 leading-relaxed text-fg/85">{s.summary[lang]}</p>
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
