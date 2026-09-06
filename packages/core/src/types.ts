/** Tipos compartidos del motor. Sin dependencias de plataforma. */

export interface VerseRef {
  /** 1 Bereshit, 2 Shemot, 3 Vaikrá, 4 Bamidbar, 5 Devarim */
  book: number;
  chapter: number;
  verse: number;
}

/** Datos del texto, producidos por @kore/data en dist/torah.json */
export interface TorahData {
  source: { repo: string; commit: string };
  wordCount: number;
  /** palabras consonánticas en orden del rollo */
  words: string[];
  /** índice de versículo por palabra */
  wordVerse: number[];
  /** versículos en orden, con la palabra inicial */
  verses: Array<{ book: number; chapter: number; verse: number; start: number }>;
  /** índices de palabra precedidos por un espacio de petujá */
  petuchaBefore: number[];
  /** índices de palabra precedidos por un espacio dentro de la línea, típico de setumá */
  gapBefore: number[];
}

/** Layout estándar de 245 columnas, dist/layout-245.json */
export interface LayoutData {
  columns: Array<{
    n: number;
    startWord: number;
    endWord: number;
    lines: Array<{ start: number; end: number; text: string; petucha: boolean; gap: boolean }>;
  }>;
}

export interface AliyahData {
  /** 1..7 o "M" para maftir */
  n: number | "M";
  startWord: number;
  endWord: number;
  start: VerseRef;
  end: VerseRef;
}

export interface ParashaData {
  n: number;
  name: { en: string; he: string; es: string };
  book: number;
  startWord: number;
  endWord: number;
  start: VerseRef;
  end: VerseRef;
  aliyot: AliyahData[];
}

export type ParashotData = ParashaData[];

/** Salida del OCR, una línea por línea visual del rollo, en orden de lectura. */
export interface OcrLine {
  text: string;
  /** el OCR duda de esta línea */
  uncertain?: boolean;
  /** espacio en blanco antes de la línea: ninguno, parcial (setumá) o línea completa (petujá) */
  gapBefore?: "none" | "partial" | "full";
}

export interface OcrResult {
  lines: OcrLine[];
  /** cantidad de líneas visibles en la columna, aunque no se hayan transcripto todas */
  lineCountVisible?: number;
}

export type ConfidenceStatus = "confident" | "ambiguous" | "insufficient";

export interface AlignmentCandidate {
  startWord: number;
  endWord: number;
  score: number;
  /** tokens alineados / tokens totales */
  coverage: number;
  alignedTokens: number;
  linesCovered: number;
  /** por cada línea del OCR, índice de la primera palabra alineada o null */
  lineStarts: Array<number | null>;
}

export interface LayoutEstimate {
  linesTranscribed: number;
  linesVisible: number;
  wordsPerLine: number;
  /** estimación de palabras por columna si la foto muestra la columna completa */
  wordsPerColumn: number | null;
}

export interface StandardColumnMatch {
  column: number;
  /** la primera línea transcripta coincide con el inicio de la columna */
  fromColumnStart: boolean;
  /** línea de la columna estándar donde arranca la primera línea del OCR, 1..42 */
  firstLine: number | null;
}

export interface Placement {
  span: { startWord: number; endWord: number };
  book: { n: number; name: { en: string; he: string; es: string } };
  /** parashot que intersectan el span, en orden; casi siempre una */
  parashot: Array<{ n: number; name: { en: string; he: string; es: string } }>;
  /** aliot que intersectan el span */
  aliyot: Array<{ parasha: number; parashaName: { en: string; he: string; es: string }; n: number | "M"; startsHere: boolean }>;
  verses: { start: VerseRef; end: VerseRef };
  /** primeras palabras alineadas, consonánticas */
  firstWords: string;
  /** primeras palabras con nikud si el span cae en el layout estándar */
  firstWordsVocalized: string | null;
  standardColumn: StandardColumnMatch | null;
  layout: LayoutEstimate;
  confidence: { score: number; margin: number; alignedTokens: number; linesCovered: number; coverage: number };
}

export interface LocateResult {
  status: ConfidenceStatus;
  best: Placement | null;
  /** candidatos alternativos cuando hay ambigüedad */
  alternatives: Placement[];
  /** motivos en lenguaje llano, en español */
  reasons: string[];
  /** qué hacer para mejorar */
  suggestions: string[];
  debug?: {
    tokens: number;
    candidates: AlignmentCandidate[];
    elapsedMs: number;
  };
}
