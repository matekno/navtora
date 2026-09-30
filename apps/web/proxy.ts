/**
 * Redirects / to /es or /en by the NEXT_LOCALE cookie or Accept-Language, and
 * sends visitors without a session from the app to the login page. API routes
 * check the session themselves.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAuthorized } from "@/lib/auth";
import { LOCALE_COOKIE, localeFromPath, negotiateLocale } from "@/lib/i18n/locales";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lang = localeFromPath(pathname);
  if (!lang) {
    const locale = negotiateLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  const inApp = pathname === `/${lang}/app` || pathname.startsWith(`/${lang}/app/`);
  if (inApp && !isAuthorized(request.cookies.get(SESSION_COOKIE)?.value)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/login`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  // everything except /api, Next internals and files with an extension
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
