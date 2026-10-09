"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Calls an admin API with DELETE, after confirming, and refreshes the page. */
export function DeleteButton({ url, label, confirmText }: { url: string; label: string; confirmText: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(confirmText)) return;
        setBusy(true);
        await fetch(url, { method: "DELETE" }).catch(() => undefined);
        setBusy(false);
        router.refresh();
      }}
      className="h-9 rounded-lg border border-line px-3 text-xs text-bad disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function LogoutButton({ label, lang }: { label: string; lang: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/login", { method: "DELETE" }).catch(() => undefined);
        window.location.assign(`/${lang}`);
      }}
      className="h-9 rounded-full border border-line px-3 text-sm text-muted"
    >
      {label}
    </button>
  );
}
