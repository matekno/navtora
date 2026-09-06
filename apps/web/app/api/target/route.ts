import { NextResponse } from "next/server";
import { listParashot, resolveTargets } from "@/lib/targets";
import type { TargetRequest } from "@/lib/target-types";

export const runtime = "nodejs";

/** Lista de parashot con sus aliot, para el selector. */
export async function GET(): Promise<Response> {
  return NextResponse.json({ parashot: listParashot() });
}

/** Resuelve un objetivo a posiciones en el texto: parashá y aliá, pasuk, o lectura del día. */
export async function POST(req: Request): Promise<Response> {
  let body: TargetRequest;
  try {
    body = (await req.json()) as TargetRequest;
  } catch {
    return NextResponse.json({ targets: [], error: "Se esperaba JSON." }, { status: 400 });
  }
  if (!body || !["aliyah", "verse", "today"].includes(body.kind)) {
    return NextResponse.json({ targets: [], error: "kind tiene que ser aliyah, verse o today." }, { status: 400 });
  }
  if (body.kind === "verse" && !(body.book >= 1 && body.book <= 5 && body.chapter >= 1 && body.verse >= 1)) {
    return NextResponse.json({ targets: [], error: "Referencia inválida." }, { status: 400 });
  }
  if (body.kind === "today" && body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ targets: [], error: "La fecha tiene que ser AAAA-MM-DD." }, { status: 400 });
  }
  try {
    const res = resolveTargets(body);
    return NextResponse.json(res, { status: res.error && res.targets.length === 0 ? 404 : 200 });
  } catch (err) {
    return NextResponse.json({ targets: [], error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
