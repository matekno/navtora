import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog/posts";
import { LOCALES } from "@/lib/i18n";
import { requestOrigin } from "@/lib/site";

// SITE_URL, or else the address it was asked on, read on each request
export const dynamic = "force-dynamic";

/** Every public page in both languages, each listing its other-language version. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await requestOrigin();
  const paths = ["", "/app", "/blog", ...POSTS.map((p) => `/blog/${p.slug}`)];
  return paths.flatMap((path) =>
    LOCALES.map((lang) => ({
      url: `${origin}/${lang}${path}`,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${origin}/${l}${path}`])) },
    })),
  );
}
