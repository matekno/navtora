/** Support and dedication types shared by client and server. */

/** How people can support the app; each is null when the server doesn't set it. */
export interface SupportInfo {
  email: string | null;
  /** digits only, for wa.me */
  whatsapp: string | null;
  donateUrl: string | null;
}

/** A dedication as the app shows it. */
export interface DedicationView {
  id: number;
  kind: "week" | "jag" | "custom";
  /** "Semana de Bereshit", "Pésaj" */
  label: string;
  name: string;
  message: string | null;
  start: string;
  end: string;
}

export function hasSupport(s: SupportInfo): boolean {
  return Boolean(s.email || s.whatsapp || s.donateUrl);
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
