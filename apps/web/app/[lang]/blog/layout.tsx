import { Frank_Ruhl_Libre } from "next/font/google";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitch } from "@/lib/i18n/context";

const scrollFont = Frank_Ruhl_Libre({ subsets: ["hebrew"], weight: ["400", "500"], variable: "--font-scroll", display: "swap" });

const GITHUB_URL = "https://github.com/matekno/navtora";

export default async function BlogLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDictionary(lang);
  return (
    <div className={`${scrollFont.variable} blog min-h-dvh overflow-x-clip`}>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <a href={`/${t.lang}`} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/icon.svg" alt="" width={24} height={24} className="rounded-md" />
            {/* on narrow phones the icon alone leaves room for the links */}
            <span className="max-[419px]:sr-only">{t.app.name}</span>
          </a>
          <nav className="flex items-center gap-1 text-sm text-muted sm:gap-2">
            <a href={`/${t.lang}/blog`} className="rounded-full px-2.5 py-1.5 hover:text-fg sm:px-3">
              {t.landing.nav.blog}
            </a>
            <a href={GITHUB_URL} className="hidden rounded-full px-3 py-1.5 hover:text-fg sm:block">
              {t.landing.nav.code}
            </a>
            <LanguageSwitch className="h-8 rounded-full border border-line px-3 text-sm text-muted hover:text-fg" />
            <a href={`/${t.lang}/app`} className="inline-flex h-8 items-center whitespace-nowrap rounded-full bg-accent px-3 text-sm font-semibold text-ink transition hover:brightness-110">
              {t.landing.nav.app}
            </a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-10 pt-16 text-sm text-muted sm:px-6">
        <a href={`/${t.lang}`} className="hover:text-fg">
          {t.app.name}
        </a>
        <span>{t.landing.license}</span>
      </footer>
    </div>
  );
}
