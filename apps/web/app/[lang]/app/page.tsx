import type { Metadata } from "next";
import { ScanApp } from "@/components/ScanApp";
import { activeDedications } from "@/lib/dedications";
import { DEFAULT_LOCALE, hasLocale } from "@/lib/i18n";
import { alternates } from "@/lib/site";
import { getSupport } from "@/lib/support";

// the week's dedication and the contact settings are read on each request
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: alternates(hasLocale(lang) ? lang : DEFAULT_LOCALE, "/app") };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  return <ScanApp support={getSupport()} dedications={activeDedications(locale)} />;
}
