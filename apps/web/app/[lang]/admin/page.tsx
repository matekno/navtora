import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DeleteButton, LogoutButton } from "@/components/admin/AdminActions";
import { DedicationForm, type PeriodOption } from "@/components/admin/DedicationForm";
import { SESSION_COOKIE, isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listDedications, toView, upcomingJaguim, upcomingWeeks, type DedicationRow, type Period } from "@/lib/dedications";
import { DEFAULT_LOCALE, LOCALE_TAG, getDictionary, hasLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { getParashot } from "@/lib/locator";
import { adminStats, type FeedbackRow, type RangeStats, type ScanRow } from "@/lib/stats";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = { confident: "bg-ok/15 text-ok", ambiguous: "bg-warn/15 text-warn", insufficient: "bg-bad/15 text-bad", error: "bg-bad/15 text-bad" };

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((100 * part) / whole)}%` : "–";
}

function placeLabel(row: { book: number | null; parasha: number | null; col: number | null }, lang: Locale, t: Dictionary): string {
  const parts: string[] = [];
  if (row.parasha) parts.push(getParashot()[row.parasha - 1]?.name[lang] ?? String(row.parasha));
  if (row.col) parts.push(t.admin.column(row.col));
  return parts.join(" · ");
}

function RangeCard({ title, s, t }: { title: string; s: RangeStats; t: Dictionary }) {
  return (
    <div className="rounded-2xl bg-panel p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {s.users} <span className="text-sm font-normal text-muted">{t.admin.kpi.users.toLowerCase()}</span>
      </div>
      <div className="text-sm text-muted">
        {s.newUsers} {t.admin.kpi.newUsers}
      </div>
      <div className="mt-3 text-lg font-medium tabular-nums">
        {s.scans} <span className="text-sm font-normal text-muted">{t.admin.kpi.scans.toLowerCase()}</span>
      </div>
      <div className="text-sm text-muted">
        {pct(s.confident, s.scans)} {t.admin.kpi.located}
      </div>
      <div className="mt-3 text-sm tabular-nums">
        👍 {s.up} · 👎 {s.down}
        {s.photos > 0 && <span className="text-muted"> · {t.admin.kpi.photos(s.photos)}</span>}
      </div>
      {s.medianMs !== null && <div className="mt-1 text-xs text-muted">{t.admin.kpi.median((s.medianMs / 1000).toFixed(1))}</div>}
    </div>
  );
}

function ScanDetails({ text, t }: { text: string | null; t: Dictionary }) {
  if (!text) return null;
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-muted">{t.admin.readText}</summary>
      <pre className="hebrew mt-2 whitespace-pre-wrap rounded-xl bg-panel-2 p-3 text-base leading-relaxed">{text}</pre>
    </details>
  );
}

function FeedbackItem({ f, lang, t, when }: { f: FeedbackRow; lang: Locale; t: Dictionary; when: (ts: string) => string }) {
  const reason = f.reason === "uncertain" ? t.feedback.uncertainReason : f.reason ? (t.feedback.reasons as Record<string, string>)[f.reason] ?? f.reason : null;
  const place = placeLabel(f, lang, t);
  return (
    <li className="rounded-2xl bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px]">
            {f.vote === "up" ? "👍" : f.vote === "down" ? "👎" : "📷"} {reason && <span className="font-medium">{reason}</span>}
          </div>
          <div className="text-xs text-muted">
            {when(f.ts)}
            {f.lang ? ` · ${f.lang}` : ""}
            {f.scan_status ? ` · ${f.scan_kind ? t.admin.kind[f.scan_kind] ?? f.scan_kind : ""} ${t.admin.status[f.scan_status] ?? f.scan_status}` : ""}
            {place ? ` · ${place}` : ""}
            {f.nav ? ` · ${t.admin.nav(f.nav)}` : ""}
          </div>
        </div>
        <DeleteButton url={`/api/admin/feedback?id=${encodeURIComponent(f.id)}`} label={t.admin.delete} confirmText={t.admin.confirmDelete} />
      </div>
      {f.comment && (
        <p dir="auto" className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">
          {f.comment}
        </p>
      )}
      {f.photo && (
        <div className="mt-3 flex items-end gap-3">
          <a href={`/api/admin/photo?id=${encodeURIComponent(f.id)}`} target="_blank" rel="noopener noreferrer">
            <img src={`/api/admin/photo?id=${encodeURIComponent(f.id)}`} alt="" loading="lazy" className="h-32 w-24 rounded-lg border border-line object-cover" />
          </a>
          <a href={`/api/admin/photo?id=${encodeURIComponent(f.id)}&download=1`} className="text-sm text-accent">
            {t.admin.download}
          </a>
        </div>
      )}
      <ScanDetails text={f.text} t={t} />
    </li>
  );
}

function ScanItem({ s, lang, t, when }: { s: ScanRow; lang: Locale; t: Dictionary; when: (ts: string) => string }) {
  const place = placeLabel(s, lang, t);
  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? "bg-panel-2"}`}>{t.admin.status[s.status] ?? s.status}</span>
        <span className="text-muted">{when(s.ts)}</span>
        <span className="text-muted">· {t.admin.kind[s.kind] ?? s.kind}</span>
        {place && <span>· {place}</span>}
        {s.nav && <span className="text-muted">· {t.admin.nav(s.nav)}</span>}
        {s.lines !== null && <span className="text-muted">· {s.lines} L</span>}
        {s.total_ms !== null && s.kind === "camera" && <span className="text-muted">· {(s.total_ms / 1000).toFixed(1)} s</span>}
      </div>
      {s.target && <div className="mt-1 text-xs text-muted">{t.admin.target(s.target)}</div>}
      <ScanDetails text={s.text} t={t} />
    </li>
  );
}

function DedicationItem({ row, lang, t, today }: { row: DedicationRow; lang: Locale; t: Dictionary; today: string }) {
  const d = toView(row, lang);
  const now = d.start <= today && d.end >= today;
  return (
    <li className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-accent">
          {d.label}
          {now && <span className="ml-2 rounded-full bg-ok/15 px-2 py-0.5 normal-case text-ok">{t.admin.now}</span>}
        </div>
        <div dir="auto" className="mt-1 font-medium">
          {d.name}
        </div>
        {d.message && (
          <div dir="auto" className="text-sm text-muted">
            {d.message}
          </div>
        )}
        <div className="mt-1 text-xs text-muted">{t.admin.range(d.start, d.end)}</div>
      </div>
      <DeleteButton url={`/api/admin/dedications?id=${d.id}`} label={t.admin.delete} confirmText={t.admin.confirmDelete} />
    </li>
  );
}

export default async function AdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const store = await cookies();
  if (!isAdmin(store.get(SESSION_COOKIE)?.value)) redirect(`/${locale}/login`);
  const t = getDictionary(locale);
  const fmt = new Intl.DateTimeFormat(LOCALE_TAG[locale], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const when = (ts: string) => fmt.format(new Date(ts));
  const dayFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale], { weekday: "short", day: "numeric", month: "numeric" });

  const dbOk = getDb() !== null;
  const stats = adminStats();
  const dedications = dbOk ? listDedications() : { upcoming: [], past: [] };
  const taken = new Set([...dedications.upcoming, ...dedications.past].map((d) => `${d.kind}:${d.key}`));
  const option = (p: Period): PeriodOption => ({ key: p.key, label: p.label, start: p.start, end: p.end, taken: taken.has(`${p.kind}:${p.key}`) });
  const weeks = upcomingWeeks(locale, 30).map(option);
  const jaguim = upcomingJaguim(locale).map(option);
  const today = stats.days[0]?.day ?? "";
  const cols = t.admin.cols;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.app.name} · {t.admin.title}
        </h1>
        <div className="flex items-center gap-2">
          <a href={`/${locale}/app`} className="h-9 rounded-full border border-line px-3 text-sm leading-9 text-fg">
            {t.admin.openApp}
          </a>
          <LogoutButton label={t.admin.logout} lang={locale} />
        </div>
      </header>

      {!dbOk && <p className="mt-6 rounded-2xl bg-bad/15 px-4 py-3 text-[15px] text-bad">{t.admin.dbOff}</p>}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RangeCard title={t.admin.ranges.today} s={stats.today} t={t} />
        <RangeCard title={t.admin.ranges.week} s={stats.week} t={t} />
        <RangeCard title={t.admin.ranges.month} s={stats.month} t={t} />
        <RangeCard title={t.admin.ranges.total} s={stats.total} t={t} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.admin.daysTitle}</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-panel">
          <table className="w-full min-w-[34rem] text-right text-sm tabular-nums">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-left font-normal">{cols.day}</th>
                <th className="px-2 py-2 font-normal">{cols.users}</th>
                <th className="px-2 py-2 font-normal">{cols.newUsers}</th>
                <th className="px-2 py-2 font-normal">{cols.scans}</th>
                <th className="px-2 py-2 font-normal">{cols.confident}</th>
                <th className="px-2 py-2 font-normal">{cols.ambiguous}</th>
                <th className="px-2 py-2 font-normal">{cols.insufficient}</th>
                <th className="px-2 py-2 font-normal">{cols.errors}</th>
                <th className="px-2 py-2 font-normal">{cols.up}</th>
                <th className="px-3 py-2 font-normal">{cols.down}</th>
              </tr>
            </thead>
            <tbody>
              {stats.days.map((d) => (
                <tr key={d.day} className="border-b border-line last:border-b-0">
                  <td className="whitespace-nowrap px-3 py-2 text-left text-muted">{dayFmt.format(new Date(`${d.day}T12:00:00`))}</td>
                  <td className="px-2 py-2">{d.users || "·"}</td>
                  <td className="px-2 py-2">{d.newUsers || "·"}</td>
                  <td className="px-2 py-2">{d.scans || "·"}</td>
                  <td className="px-2 py-2 text-ok">{d.confident || "·"}</td>
                  <td className="px-2 py-2 text-warn">{d.ambiguous || "·"}</td>
                  <td className="px-2 py-2 text-bad">{d.insufficient || "·"}</td>
                  <td className="px-2 py-2 text-bad">{d.errors || "·"}</td>
                  <td className="px-2 py-2">{d.up || "·"}</td>
                  <td className="px-3 py-2">{d.down || "·"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.admin.feedbackTitle}</h2>
        {stats.feedback.length === 0 ? (
          <p className="mt-3 text-[15px] text-muted">{t.admin.feedbackEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {stats.feedback.map((f) => (
              <FeedbackItem key={f.id} f={f} lang={locale} t={t} when={when} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.admin.dedicationsTitle}</h2>
        <div className="mt-3">
          <DedicationForm weeks={weeks} jaguim={jaguim} />
        </div>
        {dedications.upcoming.length === 0 ? (
          <p className="mt-3 text-[15px] text-muted">{t.admin.dedicationsEmpty}</p>
        ) : (
          <ul className="mt-3 rounded-2xl bg-panel px-4">
            {dedications.upcoming.map((row) => (
              <DedicationItem key={row.id} row={row} lang={locale} t={t} today={today} />
            ))}
          </ul>
        )}
        {dedications.past.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-muted">{t.admin.pastTitle}</summary>
            <ul className="mt-2 rounded-2xl bg-panel px-4">
              {dedications.past.map((row) => (
                <DedicationItem key={row.id} row={row} lang={locale} t={t} today={today} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t.admin.scansTitle}</h2>
        {stats.scans.length === 0 ? (
          <p className="mt-3 text-[15px] text-muted">{t.admin.scansEmpty}</p>
        ) : (
          <ul className="mt-3 rounded-2xl bg-panel px-4">
            {stats.scans.map((s) => (
              <ScanItem key={s.id} s={s} lang={locale} t={t} when={when} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
