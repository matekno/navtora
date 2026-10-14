"use client";

import { useI18n } from "@/lib/i18n/context";
import type { DedicationView } from "@/lib/support-types";

/** Who the current week or jag is dedicated by. */
export function DedicationNote({ dedications, className = "mt-4" }: { dedications: DedicationView[]; className?: string }) {
  const { t } = useI18n();
  if (dedications.length === 0) return null;
  return (
    <section className={`space-y-2 ${className}`}>
      {dedications.map((d) => (
        <div key={d.id} className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-accent">{d.label}</div>
          <div className="mt-1 text-base">
            {t.dedication.by}{" "}
            <b dir="auto" className="font-semibold">
              {d.name}
            </b>
          </div>
          {d.message && (
            <div dir="auto" className="mt-1 text-sm text-muted">
              {d.message}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
