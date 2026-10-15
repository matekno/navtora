import { getDictionary, type Locale } from "@/lib/i18n";

/** The halacha post's disclaimer: the app is for getting the scroll ready beforehand, never for use on Shabbat or Yom Tov. */
export function PrepareNote({ lang, className = "" }: { lang: Locale; className?: string }) {
  const t = getDictionary(lang);
  return (
    <aside role="note" className={`rounded-2xl border border-accent/50 bg-accent/10 px-5 py-4 ${className}`}>
      <p className="font-semibold text-accent">{t.blog.prepareTitle}</p>
      <p className="mt-1 leading-relaxed text-fg/90">{t.blog.prepareText}</p>
    </aside>
  );
}
