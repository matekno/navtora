"use client";

import { useEffect, useState } from "react";
import { BOOK_NAMES } from "@kore/core";
import { aliyahLabel } from "@/lib/format";
import type { HolidayItem, ParashaListItem, ReadingInfo, TargetInfo, TargetRequest, TargetResponse } from "@/lib/target-types";

interface Props {
  onPick: (targets: TargetInfo[], active: number) => void;
  onCancel: () => void;
}

type Tab = "today" | "holidays" | "aliyah" | "verse";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateEs(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function TargetPicker({ onPick, onCancel }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [parashot, setParashot] = useState<ParashaListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [il, setIl] = useState(false);

  // parashá y aliá
  const [parasha, setParasha] = useState<number>(1);
  // pasuk
  const [book, setBook] = useState(1);
  const [chapter, setChapter] = useState("1");
  const [verse, setVerse] = useState("1");
  // fecha
  const [date, setDate] = useState(todayISO());
  const [readings, setReadings] = useState<ReadingInfo[] | null>(null);
  const [hebrewDate, setHebrewDate] = useState<string>("");
  const [next, setNext] = useState<TargetResponse["next"]>(null);
  // jaguim
  const [year, setYear] = useState<number | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[] | null>(null);
  const [openHoliday, setOpenHoliday] = useState<string | null>(null);
  const [holidayReadings, setHolidayReadings] = useState<Record<string, ReadingInfo[]>>({});

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

  // lectura de la fecha elegida
  useEffect(() => {
    if (tab !== "today") return;
    let cancelled = false;
    void resolve({ kind: "today", date, il }).then((body) => {
      if (cancelled || !body) return;
      setReadings(body.readings ?? []);
      setHebrewDate(body.hebrewDate ?? "");
      setNext(body.next ?? null);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date, il]);

  // jaguim del año
  useEffect(() => {
    if (tab !== "holidays") return;
    let cancelled = false;
    void resolve({ kind: "holidays", ...(year !== null ? { year } : {}), il }).then((body) => {
      if (cancelled || !body) return;
      setHolidays(body.holidays ?? []);
      setYears(body.years ?? []);
      if (body.year && year === null) setYear(body.year);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, year, il]);

  async function openHolidayItem(h: HolidayItem): Promise<void> {
    if (openHoliday === h.dateISO) {
      setOpenHoliday(null);
      return;
    }
    setOpenHoliday(h.dateISO);
    if (!holidayReadings[h.dateISO]) {
      const body = await resolve({ kind: "today", date: h.dateISO, il });
      if (body) setHolidayReadings((prev) => ({ ...prev, [h.dateISO]: body.readings ?? [] }));
    }
  }

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
            ["today", "Fecha"],
            ["holidays", "Jaguim"],
            ["aliyah", "Parashá"],
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

      {(tab === "today" || tab === "holidays") && (
        <label className="mt-3 flex items-center gap-2 self-end text-sm text-muted">
          <input type="checkbox" checked={il} onChange={(e) => setIl(e.target.checked)} className="size-4 accent-accent" />
          Calendario de Israel
        </label>
      )}

      {error && <div className="mt-4 rounded-xl bg-bad/15 px-4 py-3 text-sm text-bad">{error}</div>}

      {tab === "today" && (
        <section className="mt-4 space-y-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-panel px-3 text-base"
            aria-label="Fecha"
          />
          {hebrewDate && <div className="hebrew text-lg text-muted">{hebrewDate}</div>}
          {busy && <div className="text-sm text-muted">Consultando el calendario…</div>}
          {readings && readings.length === 0 && !busy && (
            <div className="rounded-xl bg-panel p-4 text-sm text-muted">
              Ese día no hay lectura de la Torá.
              {next && (
                <button type="button" onClick={() => setDate(next.dateISO)} className="mt-3 block w-full rounded-xl border border-line px-3 py-2 text-left text-fg">
                  La próxima es el {formatDateEs(next.dateISO)}: <b>{next.names.join(", ")}</b>
                </button>
              )}
            </div>
          )}
          {readings?.map((r) => <ReadingBlock key={r.name} reading={r} onPick={onPick} />)}
        </section>
      )}

      {tab === "holidays" && (
        <section className="mt-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium ${year === y ? "bg-accent text-ink" : "border border-line text-fg"}`}
              >
                {y}
              </button>
            ))}
          </div>
          {busy && !holidays && <div className="text-sm text-muted">Armando el calendario…</div>}
          <ul className="space-y-2">
            {holidays?.map((h) => (
              <li key={h.dateISO} className="rounded-2xl bg-panel">
                <button type="button" onClick={() => void openHolidayItem(h)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-base font-medium">{h.names.join(" · ")}</div>
                    <div className="shrink-0 text-xs text-muted">{formatDateEs(h.dateISO)}</div>
                  </div>
                  <div className="hebrew text-sm text-muted">{h.hebrewDate}</div>
                  <div className="mt-1 text-xs text-muted">{h.summary}</div>
                </button>
                {openHoliday === h.dateISO && (
                  <div className="space-y-3 px-4 pb-4">
                    {!holidayReadings[h.dateISO] && <div className="text-sm text-muted">Cargando…</div>}
                    {holidayReadings[h.dateISO]?.map((r) => <ReadingBlock key={r.name} reading={r} onPick={onPick} bare />)}
                  </div>
                )}
              </li>
            ))}
          </ul>
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

/** Una lectura con sus aliot como botones. */
function ReadingBlock({ reading: r, onPick, bare = false }: { reading: ReadingInfo; onPick: Props["onPick"]; bare?: boolean }) {
  return (
    <div className={bare ? "" : "rounded-2xl bg-panel p-4"}>
      <div className="text-base font-medium">{r.name}</div>
      <div className="text-xs text-muted">{r.summary}</div>
      {r.multipleBooks && <div className="mt-1 text-xs text-warn">Hay lecturas en más de un libro: probablemente se usen dos sifrei.</div>}
      {r.targets.filter((t) => t.reason).map((t) => (
        <div key={t.id} className="mt-1 text-xs text-warn">
          {t.aliyah === "M" ? "Maftir especial" : `${t.aliyah}ª aliá especial`}: {t.reason}, {t.bookName} {t.ref.chapter}:{t.ref.verse}. Suele leerse de un segundo sefer.
        </div>
      ))}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {r.targets.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(r.targets, i)}
            className="flex h-12 flex-col items-center justify-center rounded-xl border border-line text-sm active:bg-panel-2"
            title={`${t.bookName} ${t.ref.chapter}:${t.ref.verse}`}
          >
            <span>{t.aliyah === "M" ? "Maftir" : `${t.aliyah}ª`}</span>
            <span className="text-[10px] text-muted">{t.bookName}</span>
          </button>
        ))}
      </div>
      {r.targets.length > 1 && (
        <button type="button" onClick={() => onPick(r.targets, 0)} className="mt-3 h-11 w-full rounded-xl bg-accent text-sm font-semibold text-ink">
          Preparar desde la primera aliá
        </button>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
