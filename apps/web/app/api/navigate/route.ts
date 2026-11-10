import { NextResponse } from "next/server";
import { navigate, type NavTarget, type Navigation, type Placement } from "@navtora/core";
import { getLayout, getLocator } from "@/lib/locator";
import { limitRequest } from "@/lib/rate-limit";
import { parseClientId, recordNavigation } from "@/lib/stats";

export const runtime = "nodejs";

export interface NavigateRequest {
  /** where the last scan placed the sefer: the fields of its Placement that navigation uses */
  placement: Pick<Placement, "span" | "standardColumn" | "layout">;
  /** the scan's per-line alignment, if known */
  lineStarts?: Array<number | null>;
  target: NavTarget;
  /** words per column learned for this sefer */
  wpc?: number;
  /** the scan this navigation follows, to note its target in the stats */
  scanId?: string;
  client?: string;
}

export interface NavigateResponse {
  navigation: Navigation;
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const isNum = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

/** The parts of a placement that navigation reads, checked one by one; null if any is off. */
function parsePlacement(raw: unknown, words: number, columns: number): NavigateRequest["placement"] | null {
  const p = raw as Partial<Placement> | null;
  if (!p || typeof p !== "object") return null;
  const span = p.span;
  if (!span || !isInt(span.startWord, 0, words - 1) || !isInt(span.endWord, span.startWord, words - 1)) return null;
  const l = p.layout;
  if (!l || !isInt(l.linesTranscribed, 0, 200) || !isInt(l.linesVisible, 0, 200) || !isNum(l.wordsPerLine, 0, 100)) return null;
  if (l.wordsPerColumn !== null && !isNum(l.wordsPerColumn, 0, 5000)) return null;
  const c = p.standardColumn;
  let standardColumn: Placement["standardColumn"] = null;
  if (c) {
    if (!isInt(c.column, 1, columns) || (c.firstLine !== null && !isInt(c.firstLine, 1, 100))) return null;
    standardColumn = { column: c.column, fromColumnStart: c.fromColumnStart === true, firstLine: c.firstLine };
  }
  return {
    span: { startWord: span.startWord, endWord: span.endWord },
    standardColumn,
    layout: { linesTranscribed: l.linesTranscribed, linesVisible: l.linesVisible, wordsPerLine: l.wordsPerLine, wordsPerColumn: l.wordsPerColumn ?? null },
  };
}

function parseTarget(raw: unknown, words: number): NavTarget | null {
  const t = raw as Partial<NavTarget> | null;
  if (!t || typeof t !== "object" || !isInt(t.word, 0, words - 1) || typeof t.label !== "string" || t.label.length > 200) return null;
  const r = t.ref;
  if (!r || !isInt(r.book, 1, 5) || !isInt(r.chapter, 1, 200) || !isInt(r.verse, 1, 200)) return null;
  return { word: t.word, label: t.label, ref: { book: r.book, chapter: r.chapter, verse: r.verse }, ...(isInt(t.endWord, t.word, words - 1) ? { endWord: t.endWord } : {}) };
}

/**
 * Navigation from a position the app already knows to a new target, so that
 * choosing where to go after a scan doesn't need another scan. The position
 * is what /api/scan or /api/locate answered; nothing is read again.
 */
export async function POST(req: Request): Promise<Response> {
  const limited = limitRequest(req, "scan", 120);
  if (limited) return limited;
  let body: Partial<NavigateRequest>;
  try {
    body = (await req.json()) as Partial<NavigateRequest>;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  const locator = getLocator();
  const layout = getLayout();
  const words = locator.text.length;
  const placement = parsePlacement(body.placement, words, layout.columns.length);
  const target = parseTarget(body.target, words);
  if (!placement || !target) return NextResponse.json({ error: "Expected a placement and a target." }, { status: 400 });
  const lineStarts =
    Array.isArray(body.lineStarts) && body.lineStarts.length <= 80 && body.lineStarts.every((s) => s === null || isInt(s, 0, words - 1))
      ? body.lineStarts
      : undefined;
  const wpc = isNum(body.wpc, 51, 1999) ? body.wpc : null;

  // navigate only reads these fields of the placement
  const navigation = navigate(placement as Placement, target, { text: locator.text, layout, learnedWordsPerColumn: wpc }, lineStarts);
  if (typeof body.scanId === "string") {
    const nav = navigation.status === "here" ? "here" : String(navigation.columns ?? "?");
    recordNavigation(body.scanId, parseClientId(body.client), target.label, nav);
  }
  const res: NavigateResponse = { navigation };
  return NextResponse.json(res);
}
