import type { Metadata } from "next";
import { POSTS } from "@/lib/blog/posts";
import { PostCard } from "@/components/blog/PostCard";
import { PrepareNote } from "@/components/blog/PrepareNote";
import { DEFAULT_LOCALE, getDictionary, hasLocale } from "@/lib/i18n";
import { alternates } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getDictionary(lang);
  return {
    title: `${t.blog.title} · ${t.app.name}`,
    description: t.blog.lead,
    alternates: alternates(lang, "/blog"),
  };
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getDictionary(lang);
  return (
    <main className="mx-auto max-w-5xl px-5 pb-10 pt-14 sm:px-6 sm:pt-20">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.blog.title}</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{t.blog.lead}</p>
      <PrepareNote lang={lang} className="mt-8 max-w-xl" />
      {/* the first post across the top, the rest two by two; an odd one out at the end goes across too */}
      <ul className="mt-12 grid gap-5 sm:grid-cols-2">
        {POSTS.map((p, i) => {
          const wide = i === 0 || (i === POSTS.length - 1 && POSTS.length % 2 === 0);
          return (
            <li key={p.slug} className={wide ? "sm:col-span-2" : undefined}>
              <PostCard post={p} lang={lang} featured={wide} eager={i === 0} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
