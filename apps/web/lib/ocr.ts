/**
 * OCR provider selection.
 *   OCR_PROVIDER=claude  (default) Claude vision; the model can be chosen per request
 *   OCR_PROVIDER=oracle  no API key needed: returns column OCR_ORACLE_COLUMN of the standard layout, with simulated noise
 */
import "server-only";
import { ClaudeVisionOcr, OracleOcr, type OcrProvider } from "@navtora/ocr";
import { getLayout } from "./locator";
import { DEFAULT_MODEL, isOcrModel, type OcrModelId } from "./models";

const providers = new Map<string, OcrProvider>();

export function defaultModel(): OcrModelId {
  const env = process.env.OCR_MODEL;
  return isOcrModel(env) ? env : DEFAULT_MODEL;
}

/** "missing-key" when Claude is selected but no API key is set. */
export function ocrConfigError(): "missing-key" | null {
  const kind = process.env.OCR_PROVIDER ?? "claude";
  return kind !== "oracle" && !process.env.ANTHROPIC_API_KEY ? "missing-key" : null;
}

export function getOcrProvider(model?: string): OcrProvider {
  const kind = process.env.OCR_PROVIDER ?? "claude";
  const key = kind === "oracle" ? "oracle" : isOcrModel(model) ? model : defaultModel();
  const existing = providers.get(key);
  if (existing) return existing;

  let provider: OcrProvider;
  if (kind === "oracle") {
    const column = Number(process.env.OCR_ORACLE_COLUMN ?? "50");
    provider = new OracleOcr({ layout: getLayout(), columnOf: () => column, charErrorRate: 0.15 });
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local or use OCR_PROVIDER=oracle to run without a key.");
    }
    provider = new ClaudeVisionOcr({ model: key });
  }
  providers.set(key, provider);
  return provider;
}
