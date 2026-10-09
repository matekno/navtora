"use client";

import { useI18n } from "@/lib/i18n/context";
import { hasSupport, mailtoUrl, whatsappUrl, type SupportInfo } from "@/lib/support-types";

/** How to support the app: dedicate a week or a jag by getting in touch, or donate. */
export function SupportPanel({ support, className = "" }: { support: SupportInfo; className?: string }) {
  const { t } = useI18n();
  if (!hasSupport(support)) return null;
  const contact = Boolean(support.whatsapp || support.email);
  const button = "inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-fg active:bg-panel-2";
  return (
    <div className={`rounded-2xl bg-panel p-5 ${className}`}>
      <p className="text-base font-medium">{t.support.title}</p>
      {contact && (
        <>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{t.support.lead}</p>
          <ul className="mt-4 space-y-2">
            {[t.support.week, t.support.jag].map((o) => (
              <li key={o.title} className="rounded-xl border border-line px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{o.title}</span>
                  <span className="shrink-0 font-semibold text-accent">{o.price}</span>
                </div>
                <div className="mt-1 text-sm leading-relaxed text-muted">{o.text}</div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">{t.support.contact}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {support.whatsapp && (
              <a href={whatsappUrl(support.whatsapp, t.support.message)} target="_blank" rel="noopener noreferrer" className={button}>
                {t.support.whatsapp} ↗
              </a>
            )}
            {support.email && (
              <a href={mailtoUrl(support.email, t.support.subject, t.support.message)} className={`${button} max-w-full`}>
                <span className="truncate">{support.email}</span>
              </a>
            )}
          </div>
        </>
      )}
      {support.donateUrl && (
        <>
          {contact && <p className="mt-4 text-sm text-muted">{t.support.donateLead}</p>}
          <a
            href={support.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-ink ${contact ? "" : "mt-4"}`}
          >
            {t.support.donate} ↗
          </a>
        </>
      )}
    </div>
  );
}
