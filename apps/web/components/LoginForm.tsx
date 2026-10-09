"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export function LoginForm({ enabled }: { enabled: boolean }) {
  const { t, lang } = useI18n();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password, lang }) });
      if (res.ok) {
        window.location.assign(`/${lang}/admin`);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? t.errors.http(res.status));
    } catch (err) {
      setError(t.errors.connect((err as Error).message));
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <a href={`/${lang}`} className="self-start text-sm text-muted">
        ← {t.login.back}
      </a>
      <h1 className="mt-8 text-2xl font-semibold">{t.login.title}</h1>
      {!enabled && <p className="mt-6 rounded-xl bg-panel px-4 py-3 text-[15px] leading-relaxed text-muted">{t.login.disabled}</p>}
      {enabled && (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm text-muted">
            {t.login.password}
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-line bg-panel px-3 text-lg text-fg outline-none focus:border-accent"
            />
          </label>
          {error && <div className="rounded-xl bg-bad/15 px-4 py-3 text-sm text-bad">{error}</div>}
          <button type="submit" disabled={busy || password.length === 0} className="h-14 rounded-2xl bg-accent text-lg font-semibold text-ink disabled:opacity-40">
            {t.login.submit}
          </button>
        </form>
      )}
    </main>
  );
}
