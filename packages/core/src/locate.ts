import { WordIndex } from "./index-words";
import { DEFAULT_MATCH_OPTIONS, matchTokens, tokensFromOcr, type MatchOptions } from "./match";
import { buildPlacement, type ResolveContext } from "./resolve";
import { TorahText } from "./text";
import type { LayoutData, LocateReason, LocateResult, LocateSuggestion, OcrResult, ParashotData, TorahData } from "./types";

export interface ConfidenceThresholds {
  /** minimum aligned tokens to assert a position */
  minAlignedTokens: number;
  /** minimum distinct lines with at least one aligned word */
  minLinesCovered: number;
  /** minimum fraction of tokens aligned */
  minCoverage: number;
  /** minimum relative score margin between the best and second candidate */
  minMargin: number;
  /** minimum absolute alignment score */
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
  /** manual input: one or more typed lines */
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
    const reasons: LocateReason[] = [];
    const suggestions: LocateSuggestion[] = [];

    if (tokens.length < 4) {
      reasons.push("few-words");
      suggestions.push("move-closer");
      return finish("insufficient", null, [], reasons, suggestions, tokens.length, [], t0);
    }

    const cands = matchTokens(tokens, text.words, index, ocr.lines.length, matchOpts);
    if (cands.length === 0) {
      reasons.push("no-match");
      suggestions.push("check-photo");
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
      if (best.alignedTokens < thresholds.minAlignedTokens) reasons.push("few-aligned");
      if (best.linesCovered < thresholds.minLinesCovered) reasons.push("single-line");
      if (best.coverage < thresholds.minCoverage) reasons.push("low-coverage");
      suggestions.push("more-light");
      suggestions.push("include-gap");
      const placement = buildPlacement(best, ocr, ctx, margin);
      return finish("insufficient", null, [placement], reasons, suggestions, tokens.length, cands, t0);
    }

    if (margin < thresholds.minMargin && second) {
      reasons.push("similar-passages");
      suggestions.push("show-column-start");
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
    reasons: LocateReason[],
    suggestions: LocateSuggestion[],
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
