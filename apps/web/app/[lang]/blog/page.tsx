import type { Metadata } from "next";
import { POSTS } from "@/lib/blog/posts";
import { PrepareNote } from "@/components/blog/PrepareNote";
import { DEFAULT_LOCALE, getDictionary, hasLocale, LOCALES } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getDictionary(lang);
  return {
    title: `${t.blog.title} · ${t.app.name}`,
    description: t.blog.lead,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}/blog`])) },
  };
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getDictionary(lang);
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10 pt-14 sm:px-6 sm:pt-20">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.blog.title}</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{t.blog.lead}</p>
      <PrepareNote lang={lang} className="mt-8 max-w-xl" />
      <ul className="mt-12 grid gap-4">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <a href={`/${lang}/blog/${p.slug}`} className="block rounded-3xl border border-line/70 bg-panel p-6 transition hover:border-line hover:bg-panel-2 sm:p-7">
              <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{p.title[lang]}</h2>
              <p className="mt-2 leading-relaxed text-muted">{p.description[lang]}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                {t.blog.read} <span aria-hidden>→</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
