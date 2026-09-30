/** Redirects / to /es or /en by the NEXT_LOCALE cookie or Accept-Language. */
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localeFromPath, negotiateLocale } from "@/lib/i18n/locales";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (localeFromPath(pathname)) return;
  const locale = negotiateLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // everything except /api, Next internals and files with an extension
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
