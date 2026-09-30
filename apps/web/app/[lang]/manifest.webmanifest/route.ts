import { getDictionary, LOCALES, hasLocale, type Locale } from "@/lib/i18n";

export function generateStaticParams(): Array<{ lang: Locale }> {
  return LOCALES.map((lang) => ({ lang }));
}

/** PWA manifest per locale: name and start_url change, icons don't. */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }): Promise<Response> {
  const { lang } = await params;
  if (!hasLocale(lang)) return new Response("Not found", { status: 404 });
  const t = getDictionary(lang);
  const manifest = {
    name: t.app.name,
    short_name: t.app.name,
    description: t.app.description,
    lang,
    start_url: `/${lang}/app`,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0c10",
    theme_color: "#0b0c10",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { "content-type": "application/manifest+json; charset=utf-8" } });
}
