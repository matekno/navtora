import { getDictionary } from "@/lib/i18n";
import { LanguageSwitch } from "@/lib/i18n/context";

const GITHUB_URL = "https://github.com/matekno/navtora";

export default async function Landing({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDictionary(lang);
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 pb-10 pt-8">
      <header className="flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight">{t.app.name}</div>
        <LanguageSwitch className="h-9 rounded-full border border-line px-3 text-sm text-muted" />
      </header>

      <section className="mt-12 grid items-center gap-12 md:mt-20 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{t.landing.headline}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{t.landing.lead}</p>
          <a
            href={GITHUB_URL}
            className="mt-8 inline-flex h-12 items-center rounded-2xl bg-accent px-6 text-base font-semibold text-ink active:scale-[0.99]"
          >
            {t.landing.github}
          </a>
        </div>
        <img
          src={`/landing/navigation-${t.lang}.webp`}
          alt={t.landing.screenshotAlt}
          width={300}
          height={649}
          className="mx-auto w-64 rounded-[2rem] border-4 border-panel-2 shadow-2xl md:w-72"
        />
      </section>

      <ol className="mt-16 grid gap-4 md:grid-cols-3">
        {t.landing.steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-panel p-5">
            <div className="text-sm font-medium text-accent">{i + 1}</div>
            <h2 className="mt-2 text-lg font-medium">{s.title}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 max-w-2xl text-[15px] leading-relaxed text-muted">{t.landing.status}</p>

      <footer className="mt-auto flex items-center justify-between pt-16 text-sm text-muted">
        <span>{t.landing.license}</span>
        <a href={`/${t.lang}/login`} className="text-muted/70 hover:text-fg">
          {t.landing.admin}
        </a>
      </footer>
    </main>
  );
}
