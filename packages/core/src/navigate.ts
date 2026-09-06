/**
 * Navegación: dada la posición actual del sefer (lo que se acaba de leer) y un
 * objetivo (una palabra del texto), calcular hacia dónde rolar, cuánto falta
 * en columnas, y si ya se llegó, en qué línea empieza.
 *
 * Todo se expresa en índices de palabra, independientes del layout. La
 * conversión a columnas usa el layout estándar cuando la posición coincide con
 * él, y si no, la cantidad de palabras por columna estimada en la foto.
 */
import { TorahText } from "./text";
import type { LayoutData, LayoutEstimate, Placement, VerseRef } from "./types";

export interface NavTarget {
  /** primera palabra de la lectura */
  word: number;
  /** última palabra, si se conoce */
  endWord?: number;
  /** etiqueta en español, por ejemplo "Miketz, tercera aliá" */
  label: string;
  /** referencia del versículo inicial */
  ref: VerseRef;
}

export type NavDirection = "towards-bereshit" | "towards-devarim";

export interface NavLineHint {
  /** número de línea dentro de la columna actual, 1 es la de arriba */
  line: number;
  /** la línea se calculó a partir del layout estándar o de las líneas leídas; si no, es una estimación */
  exact: boolean;
  /** primeras palabras de la lectura, consonánticas */
  firstWords: string;
  /** espacio en blanco que precede a la lectura en el rollo */
  gapBefore: "petucha" | "setuma" | "none";
  /** la lectura arranca al principio de la línea */
  atLineStart: boolean;
}

export interface Navigation {
  status: "here" | "move";
  direction: NavDirection | null;
  /** palabras entre la posición actual y el objetivo, con signo: negativo hacia Bereshit */
  wordDelta: number;
  /** columnas a rolar, redondeadas; null si no se puede estimar */
  columns: number | null;
  /** la cuenta de columnas viene del layout estándar */
  columnsExact: boolean;
  /** palabras por columna usadas para estimar, si aplica */
  wordsPerColumnUsed: number | null;
  /** cuando status es here: dónde empieza dentro de la columna */
  line: NavLineHint | null;
  /** texto en español listo para mostrar y para leer en voz alta */
  instruction: string;
}

export interface NavContext {
  text: TorahText;
  layout: LayoutData | null;
  /** palabras por columna aprendidas en escaneos anteriores de este mismo sefer, si hay */
  learnedWordsPerColumn?: number | null;
}

/** ¿la columna actual contiene el objetivo? Se usa el span de la columna estándar si coincide, o el span leído. */
function columnSpan(p: Placement, layout: LayoutData | null): { start: number; end: number } {
  if (p.standardColumn && layout) {
    const col = layout.columns[p.standardColumn.column - 1];
    if (col) return { start: col.startWord, end: col.endWord };
  }
  // sin layout conocido: extender el span leído hacia abajo con las líneas visibles no transcriptas
  const est = p.layout;
  const wordsPerLine = est.wordsPerLine > 0 ? est.wordsPerLine : 8;
  const linesBelow = Math.max(0, est.linesVisible - est.linesTranscribed);
  const linesAbove = p.standardColumn?.firstLine ? p.standardColumn.firstLine - 1 : 0;
  return {
    start: Math.max(0, p.span.startWord - Math.round(linesAbove * wordsPerLine)),
    end: p.span.endWord + Math.round(linesBelow * wordsPerLine),
  };
}

function gapBeforeWord(text: TorahText, word: number): NavLineHint["gapBefore"] {
  if (text.petuchaBefore.has(word)) return "petucha";
  if (text.gapBefore.has(word)) return "setuma";
  return "none";
}

function lineHint(p: Placement, target: NavTarget, ctx: NavContext, lineStarts: Array<number | null> | undefined): NavLineHint {
  const { text, layout } = ctx;
  const firstWords = text.slice(target.word, target.word + 3);
  const gap = gapBeforeWord(text, target.word);

  // 1. layout estándar: línea exacta
  if (p.standardColumn && layout) {
    const col = layout.columns[p.standardColumn.column - 1];
    const li = col?.lines.findIndex((l) => target.word >= l.start && target.word <= l.end);
    if (col && li !== undefined && li >= 0) {
      return { line: li + 1, exact: true, firstWords, gapBefore: gap, atLineStart: col.lines[li]!.start === target.word };
    }
  }
  // 2. dentro de las líneas transcriptas: la línea del OCR que contiene la palabra
  if (lineStarts && lineStarts.length > 0) {
    const firstLine = p.standardColumn?.firstLine ?? 1;
    for (let i = 0; i < lineStarts.length; i++) {
      const s = lineStarts[i];
      const next = lineStarts.slice(i + 1).find((x): x is number => x !== null);
      if (s !== null && s !== undefined && target.word >= s && (next === undefined || target.word < next)) {
        return { line: firstLine + i, exact: true, firstWords, gapBefore: gap, atLineStart: s === target.word };
      }
    }
  }
  // 3. estimación por palabras por línea
  const wordsPerLine = p.layout.wordsPerLine > 0 ? p.layout.wordsPerLine : 8;
  const fromTop = (p.standardColumn?.firstLine ?? 1) + (target.word - p.span.startWord) / wordsPerLine;
  return { line: Math.max(1, Math.round(fromTop)), exact: false, firstWords, gapBefore: gap, atLineStart: false };
}

function describeGap(gap: NavLineHint["gapBefore"]): string {
  if (gap === "petucha") return " Antes hay un espacio en blanco hasta el final de la línea anterior.";
  if (gap === "setuma") return " Antes hay un espacio en blanco dentro de la línea.";
  return "";
}

/**
 * Calcula la navegación desde la posición leída hacia el objetivo.
 * `lineStarts` es la alineación por línea del escaneo, si está disponible.
 */
export function navigate(p: Placement, target: NavTarget, ctx: NavContext, lineStarts?: Array<number | null>): Navigation {
  const { layout } = ctx;
  const span = columnSpan(p, layout);
  const wordDelta = target.word - p.span.startWord;

  if (target.word >= span.start && target.word <= span.end) {
    const line = lineHint(p, target, ctx, lineStarts);
    const where = line.exact ? `en la línea ${line.line}` : `cerca de la línea ${line.line}`;
    const instruction = `Llegaste. ${target.label} empieza en esta columna, ${where}, con las palabras ${line.firstWords}.${describeGap(line.gapBefore)}`;
    return { status: "here", direction: null, wordDelta, columns: 0, columnsExact: line.exact, wordsPerColumnUsed: null, line, instruction };
  }

  const direction: NavDirection = target.word < p.span.startWord ? "towards-bereshit" : "towards-devarim";

  // columnas: exactas con el layout estándar, estimadas si no
  let columns: number | null = null;
  let exact = false;
  let wordsPerColumnUsed: number | null = null;
  if (p.standardColumn && layout) {
    const targetCol = layout.columns.find((c) => target.word >= c.startWord && target.word <= c.endWord);
    if (targetCol) {
      columns = Math.abs(targetCol.n - p.standardColumn.column);
      exact = true;
    }
  }
  if (columns === null) {
    const wpc = ctx.learnedWordsPerColumn ?? p.layout.wordsPerColumn ?? (p.layout.wordsPerLine > 0 ? Math.round(p.layout.wordsPerLine * 42) : null);
    if (wpc && wpc > 0) {
      wordsPerColumnUsed = wpc;
      columns = Math.max(1, Math.round(Math.abs(target.word - span.start) / wpc));
    }
  }

  const side = direction === "towards-bereshit" ? "hacia Bereshit, las columnas de la derecha" : "hacia Devarim, las columnas de la izquierda";
  const amount =
    columns === null
      ? "No puedo estimar cuántas columnas faltan todavía; rolá un poco y volvé a escanear."
      : columns === 1
        ? "Falta una columna."
        : `${exact ? "Faltan" : "Faltan aproximadamente"} ${columns} columnas.`;
  const instruction = `Rolá ${side}. ${amount}`;
  return { status: "move", direction, wordDelta, columns, columnsExact: exact, wordsPerColumnUsed, line: null, instruction };
}

/** Ayuda para armar objetivos a partir de un versículo. */
export function targetFromVerse(text: TorahText, ref: VerseRef, label: string): NavTarget | null {
  const word = text.startOfVerse(ref);
  if (word < 0) return null;
  return { word, label, ref };
}
