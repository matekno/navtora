"use client";

import { useEffect, useState } from "react";
import { BOOK_NAMES } from "@kore/core";
import { aliyahLabel } from "@/lib/format";
import type { ParashaListItem, ReadingInfo, TargetInfo, TargetRequest, TargetResponse } from "@/lib/target-types";

interface Props {
  onPick: (targets: TargetInfo[], active: number) => void;
  onCancel: () => void;
}

type Tab = "aliyah" | "verse" | "today";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TargetPicker({ onPick, onCancel }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [parashot, setParashot] = useState<ParashaListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // parashá y aliá
  const [parasha, setParasha] = useState<number>(1);
  // pasuk
  const [book, setBook] = useState(1);
  const [chapter, setChapter] = useState("1");
  const [verse, setVerse] = useState("1");
  // hoy
  const [date, setDate] = useState(todayISO());
  const [il, setIl] = useState(false);
  const [readings, setReadings] = useState<ReadingInfo[] | null>(null);
  const [hebrewDate, setHebrewDate] = useState<string>("");

  useEffect(() => {
    fetch("/api/target")
      .then((r) => r.json())
      .then((d: { parashot: ParashaListItem[] }) => setParashot(d.parashot))
      .catch(() => setError("No pude cargar la lista de parashot."));
  }, []);

  async function resolve(req: TargetRequest): Promise<TargetResponse | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/target", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
      const body = (await res.json()) as TargetResponse;
      if (!res.ok || body.error) {
        setError(body.error ?? `Error ${res.status}`);
        return null;
      }
      return body;
    } catch (err) {
      setError(`No se pudo conectar: ${(err as Error).message}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  // cargar la lectura del día al abrir la pestaña o cambiar fecha
  useEffect(() => {
    if (tab !== "today") return;
    let cancelled = false;
    void resolve({ kind: "today", date, il }).then((body) => {
      if (cancelled || !body) return;
      setReadings(body.readings ?? []);
      setHebrewDate(body.hebrewDate ?? "");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date, il]);

  const current = parashot.find((p) => p.n === parasha);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">¿A dónde vamos?</h1>
        <button type="button" onClick={onCancel} className="h-10 rounded-xl border border-line px-4 text-sm">
          Cancelar
        </button>
      </div>

      <div role="tablist" className="mt-5 flex rounded-2xl bg-panel p-1">
        {(
          [
            ["today", "Hoy"],
            ["aliyah", "Parashá y aliá"],
            ["verse", "Pasuk"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-11 flex-1 rounded-xl text-sm font-medium ${tab === id ? "bg-accent text-ink" : "text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-xl bg-bad/15 px-4 py-3 text-sm text-bad">{error}</div>}

      {tab === "today" && (
        <section className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 flex-1 rounded-xl border border-line bg-panel px-3 text-base"
              aria-label="Fecha"
            />
            <label className="flex h-12 items-center gap-2 rounded-xl border border-line px-3 text-sm">
              <input type="checkbox" checked={il} onChange={(e) => setIl(e.target.checked)} className="size-4 accent-accent" />
              Israel
            </label>
          </div>
          {hebrewDate && <div className="hebrew text-lg text-muted">{hebrewDate}</div>}
          {busy && <div className="text-sm text-muted">Consultando el calendario…</div>}
          {readings && readings.length === 0 && !busy && (
            <div className="rounded-xl bg-panel p-4 text-sm text-muted">Ese día no hay lectura de la Torá. Probá con el shabat más cercano.</div>
          )}
          {readings?.map((r) => (
            <div key={r.name} className="rounded-2xl bg-panel p-4">
              <div className="text-base font-medium">{r.name}</div>
              <div className="text-xs text-muted">{r.summary}</div>
              {r.multipleBooks && <div className="mt-1 text-xs text-warn">Hay lecturas en más de un libro: probablemente se usen dos sifrei.</div>}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {r.targets.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onPick(r.targets, i)}
                    className="h-11 rounded-xl border border-line text-sm active:bg-panel-2"
                    title={`${t.bookName} ${t.ref.chapter}:${t.ref.verse}`}
                  >
                    {t.aliyah === "M" ? "Maftir" : `${t.aliyah}ª`}
                  </button>
                ))}
              </div>
              {r.targets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onPick(r.targets, 0)}
                  className="mt-3 h-11 w-full rounded-xl bg-accent text-sm font-semibold text-ink"
                >
                  Preparar desde la primera aliá
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === "aliyah" && (
        <section className="mt-5 space-y-4">
          <select
            value={parasha}
            onChange={(e) => setParasha(Number(e.target.value))}
            className="h-12 w-full rounded-xl border border-line bg-panel px-3 text-base"
            aria-label="Parashá"
          >
            {parashot.map((p) => (
              <option key={p.n} value={p.n}>
                {p.n}. {p.name.es} · {p.name.he}
              </option>
            ))}
          </select>
          {current && (
            <div className="grid grid-cols-4 gap-2">
              {current.aliyot.map((n) => (
                <button
                  key={String(n)}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const body = await resolve({ kind: "aliyah", parasha: current.n, aliyah: n });
                    if (body && body.targets.length) onPick(body.targets, 0);
                  }}
                  className="h-12 rounded-xl border border-line text-sm active:bg-panel-2 disabled:opacity-40"
                >
                  {n === "M" ? "Maftir" : capitalize(aliyahLabel(n)).replace(" aliá", "")}
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const body = await resolve({ kind: "aliyah", parasha: current.n });
                  if (body && body.targets.length) onPick(body.targets, 0);
                }}
                className="col-span-4 h-12 rounded-xl bg-accent text-sm font-semibold text-ink disabled:opacity-40"
              >
                Toda la parashá, aliá por aliá
              </button>
            </div>
          )}
        </section>
      )}

      {tab === "verse" && (
        <section className="mt-5 space-y-4">
          <select value={book} onChange={(e) => setBook(Number(e.target.value))} className="h-12 w-full rounded-xl border border-line bg-panel px-3 text-base" aria-label="Libro">
            {[1, 2, 3, 4, 5].map((b) => (
              <option key={b} value={b}>
                {BOOK_NAMES[b]!.es} · {BOOK_NAMES[b]!.he}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-muted">
              Capítulo
              <input type="number" inputMode="numeric" min={1} value={chapter} onChange={(e) => setChapter(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-line bg-panel px-3 text-lg text-fg" />
            </label>
            <label className="flex-1 text-sm text-muted">
              Versículo
              <input type="number" inputMode="numeric" min={1} value={verse} onChange={(e) => setVerse(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-line bg-panel px-3 text-lg text-fg" />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              const body = await resolve({ kind: "verse", book, chapter: Number(chapter), verse: Number(verse) });
              if (body && body.targets.length) onPick(body.targets, 0);
            }}
            className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-ink disabled:opacity-40"
          >
            Ir a este pasuk
          </button>
        </section>
      )}
    </main>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
