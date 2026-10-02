import { Frank_Ruhl_Libre } from "next/font/google";
import { AutoplayVideo } from "@/components/landing/AutoplayVideo";
import { CountUp } from "@/components/landing/CountUp";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitch } from "@/lib/i18n/context";
import { landingStory } from "@/lib/landing-story";

const scrollFont = Frank_Ruhl_Libre({ subsets: ["hebrew"], weight: ["400", "500"], variable: "--font-scroll", display: "swap" });

const GITHUB_URL = "https://github.com/matekno/navtora";
const DEMO_VIDEOS = [
  { name: "worn-sefer", width: 480, height: 1068 },
  { name: "printed-tikkun", width: 474, height: 1068 },
];

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-5 fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default async function Landing({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDictionary(lang);
  const story = landingStory();
  const words = t.landing.headline.split(" ");

  return (
    <div className={`${scrollFont.variable} landing overflow-x-clip`}>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-line/60 bg-ink/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <a href="#top" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/icon.svg" alt="" width={24} height={24} className="rounded-md" />
            {t.app.name}
          </a>
          <nav className="flex items-center gap-1 text-sm text-muted sm:gap-2">
            <a href="#how" className="hidden rounded-full px-3 py-1.5 hover:text-fg sm:block">
              {t.landing.nav.how}
            </a>
            <a href="#demo" className="hidden rounded-full px-3 py-1.5 hover:text-fg sm:block">
              {t.landing.nav.demo}
            </a>
            <a href={GITHUB_URL} className="hidden rounded-full px-3 py-1.5 hover:text-fg sm:block">
              {t.landing.nav.code}
            </a>
            <LanguageSwitch className="h-8 rounded-full border border-line px-3 text-sm text-muted hover:text-fg" />
          </nav>
        </div>
      </header>

      <main id="top">
        {/* hero */}
        <section className="relative isolate flex min-h-svh items-center overflow-hidden pb-16 pt-24">
          <div aria-hidden className="hero-bg-wrap pointer-events-none absolute inset-0 -z-10 flex rotate-[-7deg] scale-125 items-start justify-center gap-10 opacity-[0.09]">
            <div className="hero-bg flex gap-10">
              {story.columns.slice(0, 6).map((c) => (
                <div key={c.n} className="scroll-text w-64 shrink-0 text-[13px] leading-[1.9] text-fg">
                  {[...c.lines, ...c.lines].map((l, i) => (
                    <div key={i} className="overflow-hidden whitespace-nowrap [text-align-last:justify]">
                      {l.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--color-ink)_70%)]" />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 md:grid-cols-[1fr_auto]">
            <div>
              <a
                href="#demo"
                className="rise inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-sm text-muted backdrop-blur hover:text-fg"
                style={{ "--d": "0ms" } as React.CSSProperties}
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-ok" />
                </span>
                {t.landing.eyebrow}
              </a>
              <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                {words.map((w, i) => (
                  <span key={i}>
                    <span className="rise inline-block" style={{ "--d": `${120 + i * 70}ms` } as React.CSSProperties}>
                      {w}
                    </span>{" "}
                  </span>
                ))}
              </h1>
              <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ "--d": `${200 + words.length * 70}ms` } as React.CSSProperties}>
                {t.landing.lead}
              </p>
              <div className="rise mt-9 flex flex-wrap gap-3" style={{ "--d": `${300 + words.length * 70}ms` } as React.CSSProperties}>
                <a href="#how" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-6 text-base font-semibold text-ink transition hover:brightness-110 active:scale-[0.98]">
                  {t.landing.ctaHow} <span aria-hidden>↓</span>
                </a>
                <a href={GITHUB_URL} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-line px-5 text-base text-fg transition hover:bg-panel">
                  <GitHubMark /> {t.landing.github}
                </a>
              </div>
            </div>

            <div className="phone-tilt relative mx-auto">
              <div aria-hidden className="glow absolute left-1/2 top-1/2 -z-10 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(245_196_81/0.28),transparent_65%)]" />
              <img
                src={`/landing/navigation-${t.lang}.webp`}
                alt={t.landing.screenshotAlt}
                width={300}
                height={649}
                className="rise w-60 rounded-[2.2rem] border-[6px] border-panel-2 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)] sm:w-72"
                style={{ "--d": "250ms" } as React.CSSProperties}
              />
            </div>
          </div>
        </section>

        <ScrollStory data={story} />

        {/* numbers */}
        <section className="relative px-6 py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="reveal text-3xl font-semibold tracking-tight sm:text-4xl">{t.landing.statsTitle}</h2>
            <p className="reveal mt-3 max-w-xl text-lg text-muted">{t.landing.statsLead}</p>
            <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.landing.stats.map((s, i) => (
                <div key={s.label} className="reveal rounded-3xl border border-line/70 bg-panel p-6" style={{ "--i": i } as React.CSSProperties}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-5xl font-semibold tabular-nums tracking-tight text-accent">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </dd>
                  <dd className="mt-3 text-[15px] leading-relaxed text-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* real scrolls */}
        <section id="demo" className="scroll-mt-14 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="reveal text-3xl font-semibold tracking-tight sm:text-4xl">{t.landing.demoTitle}</h2>
            <div className="mt-12 grid gap-14 sm:grid-cols-2">
              {DEMO_VIDEOS.map((v, i) => (
                <figure key={v.name} className="reveal flex flex-col items-center" style={{ "--i": i } as React.CSSProperties}>
                  <AutoplayVideo
                    src={`/demo/${v.name}.mp4`}
                    poster={`/demo/${v.name}.webp`}
                    width={v.width}
                    height={v.height}
                    label={t.landing.demos[i]?.title ?? ""}
                    className="w-full max-w-[290px] rounded-[2rem] border-[6px] border-panel-2 bg-panel shadow-[0_30px_90px_-30px_rgb(0_0_0/0.9)]"
                  />
                  <figcaption className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">
                    <b className="font-medium text-fg">{t.landing.demos[i]?.title}.</b> {t.landing.demos[i]?.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="reveal mt-10 text-center text-sm text-muted">{t.landing.demoNote}</p>
          </div>
        </section>

        {/* open source */}
        <section className="px-6 pb-24 pt-8">
          <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-line bg-panel px-8 py-14 sm:px-14">
            <div aria-hidden className="glow absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(circle,rgb(245_196_81/0.22),transparent_65%)]" />
            <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">{t.landing.openTitle}</h2>
            <p className="relative mt-4 max-w-2xl text-lg leading-relaxed text-muted">{t.landing.status}</p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <a href={GITHUB_URL} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-6 text-base font-semibold text-ink transition hover:brightness-110">
                <GitHubMark /> {t.landing.github}
              </a>
              <a href={`${GITHUB_URL}#running-it`} className="inline-flex h-12 items-center rounded-2xl border border-line px-5 text-base text-fg transition hover:bg-panel-2">
                {t.landing.runYourOwn}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 pb-10 text-sm text-muted">
        <span>{t.landing.license}</span>
        <a href={`/${t.lang}/login`} className="text-muted/70 hover:text-fg">
          {t.landing.admin}
        </a>
      </footer>
    </div>
  );
}
