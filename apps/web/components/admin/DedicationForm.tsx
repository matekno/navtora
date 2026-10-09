"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export interface PeriodOption {
  key: string;
  label: string;
  start: string;
  end: string;
  taken: boolean;
}

type Kind = "week" | "jag" | "custom";

/** Adds a dedication for a week, a jag or a range of dates. */
export function DedicationForm({ weeks, jaguim }: { weeks: PeriodOption[]; jaguim: PeriodOption[] }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("week");
  const [key, setKey] = useState(weeks.find((w) => !w.taken)?.key ?? weeks[0]?.key ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = kind === "jag" ? jaguim : weeks;

  const pickKind = (k: Kind) => {
    setKind(k);
    const list = k === "jag" ? jaguim : weeks;
    setKey(list.find((o) => !o.taken)?.key ?? list[0]?.key ?? "");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = kind === "custom" ? { kind, start, end, name, message, lang } : { kind, key, name, message, lang };
    try {
      const res = await fetch("/api/admin/dedications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? t.errors.http(res.status));
      } else {
        setName("");
        setMessage("");
        router.refresh();
      }
    } catch (err) {
      setError(t.errors.connect((err as Error).message));
    }
    setBusy(false);
  }

  const input = "mt-1 h-11 w-full rounded-xl border border-line bg-panel-2 px-3 text-[15px] text-fg outline-none focus:border-accent";
  return (
    <form onSubmit={submit} className="rounded-2xl bg-panel p-5">
      <h3 className="text-base font-medium">{t.admin.newDedication}</h3>
      <div role="radiogroup" className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["week", t.admin.kindWeek],
            ["jag", t.admin.kindJag],
            ["custom", t.admin.kindCustom],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => pickKind(k)}
            className={`h-9 rounded-full border px-4 text-sm ${kind === k ? "border-accent bg-accent text-ink" : "border-line text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {kind === "custom" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm text-muted">
            {t.admin.from}
            <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className={input} />
          </label>
          <label className="text-sm text-muted">
            {t.admin.to}
            <input type="date" required min={start} value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
          </label>
        </div>
      ) : (
        <label className="mt-3 block text-sm text-muted">
          {t.admin.period}
          <select value={key} onChange={(e) => setKey(e.target.value)} className={input}>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label} · {t.admin.range(o.start, o.end)}
                {o.taken ? ` · ${t.admin.taken}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="mt-3 block text-sm text-muted">
        {t.admin.name}
        <input required maxLength={120} dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.admin.namePlaceholder} className={input} />
      </label>
      <label className="mt-3 block text-sm text-muted">
        {t.admin.message}
        <input maxLength={300} dir="auto" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.admin.messagePlaceholder} className={input} />
      </label>
      {error && <p className="mt-3 rounded-xl bg-bad/15 px-4 py-3 text-sm text-bad">{error}</p>}
      <button type="submit" disabled={busy || !name.trim()} className="mt-4 h-12 w-full rounded-xl bg-accent text-base font-semibold text-ink disabled:opacity-40">
        {t.admin.add}
      </button>
    </form>
  );
}
