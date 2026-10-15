import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { About } from "@/components/blog/about/About";
import { FirstVersion } from "@/components/blog/first-version/FirstVersion";
import { Halacha } from "@/components/blog/halacha/Halacha";
import { HowItWorks } from "@/components/blog/how-it-works/HowItWorks";
import { Story } from "@/components/blog/story/Story";
import { Training } from "@/components/blog/training/Training";
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
    openGraph: { title: post.title[lang], description: post.description[lang], type: "article" },
  };
}

export default async function PostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main>
      <PostHeader post={post} lang={lang} wide={post.slug === "how-it-works"} />
      {post.slug === "how-it-works" && <HowItWorks lang={lang} />}
      {post.slug === "halacha" && <Halacha lang={lang} />}
      {post.slug === "training" && <Training lang={lang} />}
      {post.slug === "first-version" && <FirstVersion lang={lang} />}
      {post.slug === "story" && <Story lang={lang} />}
      {post.slug === "about" && <About lang={lang} />}
    </main>
  );
}
