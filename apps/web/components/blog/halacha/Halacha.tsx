import type { Locale } from "@/lib/i18n";
import { PrepareNote } from "../PrepareNote";
import { SourcedArticle, type SourcedContent } from "../SourcedArticle";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";
import { SOURCES } from "./sources";

export type HalachaContent = SourcedContent;

/** "What to do when no one can read Torah": the CJLS responsum on it, and where the app helps. */
export function Halacha({ lang }: { lang: Locale }) {
  return <SourcedArticle content={lang === "es" ? contentEs : contentEn} sources={SOURCES} lang={lang} before={<PrepareNote lang={lang} className="mb-10" />} />;
}
