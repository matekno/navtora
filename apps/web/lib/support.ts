/**
 * Contact and donation settings from the environment:
 *   CONTACT_EMAIL     shown to people who want to dedicate a week or a jag
 *   CONTACT_WHATSAPP  a phone number in international format, e.g. 5491112345678
 *   DONATE_URL        an https link to a donation page (Buy Me a Coffee, Mercado Pago…)
 * Without any of them the app shows no support options.
 */
import "server-only";
import type { SupportInfo } from "./support-types";

export function parseWhatsapp(v: string | undefined): string | null {
  const digits = (v ?? "").replace(/^.*wa\.me\//, "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function parseEmail(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(s) ? s : null;
}

export function parseHttpsUrl(v: string | undefined): string | null {
  try {
    const u = new URL((v ?? "").trim());
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function getSupport(): SupportInfo {
  return {
    email: parseEmail(process.env.CONTACT_EMAIL),
    whatsapp: parseWhatsapp(process.env.CONTACT_WHATSAPP),
    donateUrl: parseHttpsUrl(process.env.DONATE_URL),
  };
}
