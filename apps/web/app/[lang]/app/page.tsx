import { ScanApp } from "@/components/ScanApp";
import { activeDedications } from "@/lib/dedications";
import { DEFAULT_LOCALE, hasLocale } from "@/lib/i18n";
import { getSupport } from "@/lib/support";

// the week's dedication and the contact settings are read on each request
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  return <ScanApp support={getSupport()} dedications={activeDedications(locale)} />;
}
