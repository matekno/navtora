import { COVER, coverSrc, type PostMeta } from "@/lib/blog/posts";
import { getDictionary, type Locale } from "@/lib/i18n";

/**
 * A post's cover, title and description, linking to it. `featured` lays it out side by side on wide
 * screens, and `eager` loads the cover right away for a card at the top of the page. The title
 * already names the link, so the cover is decorative.
 */
export function PostCard({
  post,
  lang,
  featured = false,
  eager = false,
  heading: Heading = "h2",
}: {
  post: PostMeta;
  lang: Locale;
  featured?: boolean;
  eager?: boolean;
  heading?: "h2" | "h3";
}) {
  const t = getDictionary(lang);
  return (
    <a
      href={`/${lang}/blog/${post.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-line/70 bg-panel transition hover:border-line hover:bg-panel-2 ${featured ? "md:flex-row" : ""}`}
    >
      <div className={`aspect-[16/10] shrink-0 overflow-hidden bg-panel-2 ${featured ? "md:w-[55%]" : ""}`}>
        <img
          src={coverSrc(post.slug)}
          alt=""
          width={COVER.width}
          height={COVER.height}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className={`flex flex-1 flex-col p-6 sm:p-7 ${featured ? "md:justify-center md:p-10" : ""}`}>
        <Heading className={`font-semibold tracking-tight text-fg ${featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>{post.title[lang]}</Heading>
        <p className="mt-2 leading-relaxed text-muted">{post.description[lang]}</p>
        <span className={`inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent ${featured ? "" : "mt-auto"}`}>
          {t.blog.read} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </a>
  );
}
