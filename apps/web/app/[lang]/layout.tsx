import type { Metadata, Viewport } from "next";
import { DEFAULT_LOCALE, getDictionary, LOCALES, hasLocale, type Locale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/context";
import "../globals.css";

/** Only /es and /en exist; proxy.ts redirects / by browser language. */
export const dynamicParams = false;

export function generateStaticParams(): Array<{ lang: Locale }> {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getDictionary(lang);
  return {
    title: t.app.name,
    description: t.app.description,
    applicationName: t.app.name,
    manifest: `/${lang}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: t.app.name },
    icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0c10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  return (
    <html lang={locale}>
      <body className="antialiased">
        <I18nProvider lang={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
