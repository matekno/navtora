"use client";

import type { RefLinks } from "@/lib/links";

/** Botones chicos a Sefaria y tikkun.io para una referencia. */
export function Links({ links, compact = false }: { links: RefLinks; compact?: boolean }) {
  const cls = compact
    ? "rounded-full border border-line px-3 py-1 text-xs text-muted active:bg-panel-2"
    : "rounded-xl border border-line px-4 py-2 text-sm text-fg active:bg-panel-2";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={links.sefaria} target="_blank" rel="noopener noreferrer" className={cls}>
        Sefaria ↗
      </a>
      <a href={links.tikkun} target="_blank" rel="noopener noreferrer" className={cls}>
        tikkun.io ↗
      </a>
    </div>
  );
}
