import { NextResponse } from "next/server";
import { getDictionary, langFromRequest } from "@/lib/i18n";
import { getLocator } from "@/lib/locator";
import { getScrollInfo } from "@/lib/scroll-info";

export const runtime = "nodejs";

/** Manual entry: typed Hebrew text, one or more lines. Body: { text, lang? } */
export async function POST(req: Request): Promise<Response> {
  let text: unknown;
  let lang: unknown;
  try {
    const body = (await req.json()) as { text?: unknown; lang?: unknown };
    text = body.text;
    lang = body.lang;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body with a text field." }, { status: 400 });
  }
  const t = getDictionary(langFromRequest(req, lang));
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "The text field must be a non-empty string." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: t.api.tooLong }, { status: 413 });
  }
  const locate = getLocator().locateText(text);
  return NextResponse.json({ locate, scroll: getScrollInfo() });
}
