import { NextResponse } from "next/server";
import { getDictionary, langFromRequest } from "@/lib/i18n";
import { getLocator } from "@/lib/locator";
import { limitRequest } from "@/lib/rate-limit";
import { getScrollInfo } from "@/lib/scroll-info";
import { parseClientId, recordScan } from "@/lib/stats";

export const runtime = "nodejs";

/** Manual entry: typed Hebrew text, one or more lines. Body: { text, client?, lang? } */
export async function POST(req: Request): Promise<Response> {
  const limited = limitRequest(req, "scan", 120);
  if (limited) return limited;
  let body: { text?: unknown; client?: unknown; lang?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with a text field." }, { status: 400 });
  }
  const { text } = body;
  const lang = langFromRequest(req, body.lang);
  const t = getDictionary(lang);
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "The text field must be a non-empty string." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: t.api.tooLong }, { status: 413 });
  }
  const t0 = Date.now();
  const locate = getLocator().locateText(text);
  const best = locate.best;
  const scanId = recordScan({
    client: parseClientId(body.client),
    kind: "manual",
    status: locate.status,
    lines: text.split("\n").filter((l) => l.trim()).length,
    totalMs: Date.now() - t0,
    book: best?.book.n ?? null,
    parasha: best?.parashot[0]?.n ?? null,
    column: best?.standardColumn?.column ?? null,
    text,
    lang,
  });
  return NextResponse.json({ locate, scroll: getScrollInfo(), scanId });
}
