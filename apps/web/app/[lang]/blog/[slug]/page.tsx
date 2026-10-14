import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HowItWorks } from "@/components/blog/how-it-works/HowItWorks";
import { PostHeader } from "@/components/blog/PostHeader";
import { getPost, POSTS } from "@/lib/blog/posts";
import { DEFAULT_LOCALE, getDictionary, hasLocale, LOCALES } from "@/lib/i18n";

/** Only the posts in lib/blog/posts.ts exist. */
export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const post = getPost(slug);
  if (!post) return {};
  const t = getDictionary(lang);
  return {
    title: `${post.title[lang]} · ${t.app.name}`,
    description: post.description[lang],
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}/blog/${post.slug}`])) },
    // unwritten posts are reachable but not indexed
    robots: post.date ? undefined : { index: false },
    openGraph: { title: post.title[lang], description: post.description[lang], type: "article" },
  };
}

export default async function PostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const post = getPost(slug);
  if (!post) notFound();
  const t = getDictionary(lang);

  return (
    <main>
      <PostHeader post={post} lang={lang} wide={post.slug === "how-it-works"} />
      {post.slug === "how-it-works" && <HowItWorks lang={lang} />}
      {post.date === null && (
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="mt-12 rounded-3xl border border-dashed border-line/70 p-8 text-center text-muted">{t.blog.soonText}</p>
        </div>
      )}
    </main>
  );
}
