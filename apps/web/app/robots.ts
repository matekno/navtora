import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { requestOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Everything but the API, the admin panel and its login, and where the sitemap is. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", ...LOCALES.flatMap((l) => [`/${l}/admin`, `/${l}/login`])] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
