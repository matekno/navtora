/**
 * Redirects / to /es or /en by the NEXT_LOCALE cookie, the domain or Accept-Language, and
 * sends visitors without an admin session from the admin panel to the login page.
 * API routes check the session themselves.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAdmin } from "@/lib/auth";
import { LOCALE_COOKIE, localeFromPath, negotiateLocale } from "@/lib/i18n/locales";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lang = localeFromPath(pathname);
  if (!lang) {
    const locale = negotiateLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"), request.headers.get("host"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  const inAdmin = pathname === `/${lang}/admin` || pathname.startsWith(`/${lang}/admin/`);
  if (inAdmin && !isAdmin(request.cookies.get(SESSION_COOKIE)?.value)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/login`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  // everything except /api, Next internals and files with an extension
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
