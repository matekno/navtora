import type { Locale } from "@/lib/i18n";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";

/** "How we trained the network": synthetic photos, the fonts, the training, and the tests on real sifrei. */
export function Training({ lang }: { lang: Locale }) {
  return (
    <article className="mx-auto mt-10 max-w-3xl px-5 sm:px-6">
      <div className="prose-blog">{lang === "es" ? contentEs : contentEn}</div>
    </article>
  );
}
