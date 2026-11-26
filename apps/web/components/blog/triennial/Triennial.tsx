import type { Locale } from "@/lib/i18n";
import { SourcedArticle } from "../SourcedArticle";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";
import { SOURCES } from "./sources";

/** "What the triennial cycle is": where it comes from, the CJLS responsa, and how it is chosen in the app. */
export function Triennial({ lang }: { lang: Locale }) {
  return <SourcedArticle content={lang === "es" ? contentEs : contentEn} sources={SOURCES} lang={lang} />;
}
