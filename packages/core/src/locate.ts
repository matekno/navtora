import { WordIndex } from "./index-words";
import { DEFAULT_MATCH_OPTIONS, matchTokens, tokensFromOcr, type MatchOptions } from "./match";
import { buildPlacement, type ResolveContext } from "./resolve";
import { TorahText } from "./text";
import type { LayoutData, LocateResult, OcrResult, ParashotData, TorahData } from "./types";

export interface ConfidenceThresholds {
  /** tokens alineados mínimos para afirmar algo */
  minAlignedTokens: number;
  /** líneas distintas con al menos una palabra alineada */
  minLinesCovered: number;
  /** fracción mínima de tokens alineados */
  minCoverage: number;
  /** margen relativo mínimo entre el mejor y el segundo candidato */
  minMargin: number;
  /** score absoluto mínimo del alineamiento */
  minScore: number;
}

export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  minAlignedTokens: 8,
  minLinesCovered: 2,
  minCoverage: 0.35,
  minMargin: 0.25,
  minScore: 8,
};

export interface LocatorOptions {
  thresholds?: Partial<ConfidenceThresholds>;
  match?: Partial<MatchOptions>;
  debug?: boolean;
}

export interface Locator {
  locate(ocr: OcrResult): LocateResult;
  /** entrada manual: una o varias líneas tipeadas */
  locateText(text: string): LocateResult;
  readonly text: TorahText;
  readonly index: WordIndex;
}

export function createLocator(
  data: { torah: TorahData; parashot: ParashotData; layout?: LayoutData | null },
  options: LocatorOptions = {},
): Locator {
  const text = new TorahText(data.torah);
  const index = new WordIndex(text.words);
  const thresholds: ConfidenceThresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const matchOpts: MatchOptions = { ...DEFAULT_MATCH_OPTIONS, ...options.match };
  const ctx: ResolveContext = { text, parashot: data.parashot, layout: data.layout ?? null };

  function locate(ocr: OcrResult): LocateResult {
    const t0 = Date.now();
    const tokens = tokensFromOcr(ocr);
    const reasons: string[] = [];
    const suggestions: string[] = [];

    if (tokens.length < 4) {
      reasons.push("Se leyeron muy pocas palabras.");
      suggestions.push("Acercá la cámara para que entren varias líneas completas y bien iluminadas.");
      return finish("insufficient", null, [], reasons, suggestions, tokens.length, [], t0);
    }

    const cands = matchTokens(tokens, text.words, index, ocr.lines.length, matchOpts);
    if (cands.length === 0) {
      reasons.push("No encontré ninguna parte de la Torá que coincida con lo leído.");
      suggestions.push("Verificá que la foto muestre texto del rollo, nítido y sin reflejos, y volvé a intentar.");
      return finish("insufficient", null, [], reasons, suggestions, tokens.length, cands, t0);
    }

    const best = cands[0]!;
    const second = cands[1];
    const margin = second ? (best.score - second.score) / best.score : 1;

    const strongEnough =
      best.alignedTokens >= thresholds.minAlignedTokens &&
      best.linesCovered >= thresholds.minLinesCovered &&
      best.coverage >= thresholds.minCoverage &&
      best.score >= thresholds.minScore;

    if (!strongEnough) {
      if (best.alignedTokens < thresholds.minAlignedTokens) reasons.push("Coincidieron pocas palabras con el texto.");
      if (best.linesCovered < thresholds.minLinesCovered) reasons.push("Sólo una línea coincide; no alcanza para estar seguro.");
      if (best.coverage < thresholds.minCoverage) reasons.push("La mayor parte de lo leído no coincide con el texto: la lectura salió con mucho ruido.");
      suggestions.push("Probá con más luz y con la cámara paralela al pergamino.");
      suggestions.push("Si hay una línea con espacio en blanco antes, incluila en la foto: ayuda a ubicarse.");
      const placement = buildPlacement(best, ocr, ctx, margin);
      return finish("insufficient", null, [placement], reasons, suggestions, tokens.length, cands, t0);
    }

    if (margin < thresholds.minMargin && second) {
      reasons.push("Este texto se parece a más de un pasaje de la Torá.");
      suggestions.push("Mostrame el principio de la columna o la columna de al lado para distinguirlos.");
      const alts = cands
        .filter((c) => (best.score - c.score) / best.score < thresholds.minMargin * 1.5)
        .slice(0, 3)
        .map((c) => buildPlacement(c, ocr, ctx, (best.score - c.score) / best.score));
      return finish("ambiguous", null, alts, reasons, suggestions, tokens.length, cands, t0);
    }

    const placement = buildPlacement(best, ocr, ctx, margin);
    return finish("confident", placement, [], reasons, suggestions, tokens.length, cands, t0);
  }

  function finish(
    status: LocateResult["status"],
    best: LocateResult["best"],
    alternatives: LocateResult["alternatives"],
    reasons: string[],
    suggestions: string[],
    tokenCount: number,
    candidates: ReturnType<typeof matchTokens>,
    t0: number,
  ): LocateResult {
    const res: LocateResult = { status, best, alternatives, reasons, suggestions };
    if (options.debug) res.debug = { tokens: tokenCount, candidates, elapsedMs: Date.now() - t0 };
    return res;
  }

  function locateText(input: string): LocateResult {
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return locate({ lines: lines.map((text) => ({ text })) });
  }

  return { locate, locateText, text, index };
}
