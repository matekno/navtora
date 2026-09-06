import { NextResponse } from "next/server";
import { getLocator } from "@/lib/locator";

export const runtime = "nodejs";

/** Entrada manual: texto hebreo tipeado, una o varias líneas. */
export async function POST(req: Request): Promise<Response> {
  let text: unknown;
  try {
    const body = (await req.json()) as { text?: unknown };
    text = body.text;
  } catch {
    return NextResponse.json({ error: "Se esperaba JSON con un campo text." }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "El campo text tiene que ser un string no vacío." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "El texto es demasiado largo." }, { status: 413 });
  }
  const locate = getLocator().locateText(text);
  return NextResponse.json({ locate });
}
