import type { PostMeta } from "@/lib/blog/posts";
import { getDictionary, LOCALE_TAG, type Locale } from "@/lib/i18n";

/** "14 de octubre de 2026" from an ISO date, without shifting it by the time zone. */
export function postDate(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[lang], { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

/** `wide` lines the header up with a post laid out in the wide container rather than the reading column. */
export function PostHeader({ post, lang, wide = false }: { post: PostMeta; lang: Locale; wide?: boolean }) {
  const t = getDictionary(lang);
  return (
    <header className={`mx-auto px-5 pt-12 sm:px-6 sm:pt-16 ${wide ? "max-w-6xl [&>*]:max-w-3xl" : "max-w-3xl"}`}>
      <a href={`/${lang}/blog`} className="text-sm text-muted hover:text-fg">
        <span aria-hidden>←</span> {t.blog.all}
      </a>
      <h1 className="mt-6 text-[2.2rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">{post.title[lang]}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">{post.description[lang]}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        {post.date ? <time dateTime={post.date}>{postDate(post.date, lang)}</time> : <span>{t.blog.soon}</span>}
        {post.minutes && <span aria-hidden>·</span>}
        {post.minutes && <span>{t.blog.minutes(post.minutes)}</span>}
      </div>
    </header>
  );
}
