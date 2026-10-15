import { getDictionary, type Locale } from "@/lib/i18n";

/** The end of every post: an invitation to open the app, next to a screenshot of it. `wide` lines it up like PostHeader. */
export function TryApp({ lang, wide = false }: { lang: Locale; wide?: boolean }) {
  const t = getDictionary(lang);
  return (
    <aside className={`mx-auto mt-20 px-5 sm:px-6 ${wide ? "max-w-6xl [&>*]:max-w-3xl" : "max-w-3xl"}`}>
      <div className="relative grid overflow-hidden rounded-[2rem] border border-line bg-panel sm:grid-cols-[1fr_auto]">
        <div aria-hidden className="glow absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(circle,rgb(245_196_81/0.22),transparent_65%)]" />
        <div className="relative px-7 py-10 sm:py-12 sm:pl-10 sm:pr-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.blog.tryTitle}</h2>
          <p className="mt-4 leading-relaxed text-muted">{t.blog.tryText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/${lang}/app`} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-6 text-base font-semibold text-ink transition hover:brightness-110 active:scale-[0.98]">
              {t.landing.ctaApp} <span aria-hidden>→</span>
            </a>
            <a href={`/${lang}/blog`} className="inline-flex h-12 items-center rounded-2xl border border-line px-5 text-base text-fg transition hover:bg-panel-2">
              {t.blog.all}
            </a>
          </div>
        </div>
        {/* the phone rises from the bottom edge of the card */}
        <div className="relative hidden self-end pr-10 pt-10 sm:block">
          <img
            src={`/landing/navigation-${lang}.webp`}
            alt=""
            width={300}
            height={649}
            loading="lazy"
            decoding="async"
            className="-mb-28 w-44 rotate-3 rounded-[1.8rem] border-[5px] border-panel-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
          />
        </div>
      </div>
    </aside>
  );
}
