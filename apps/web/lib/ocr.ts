/**
 * Selección del proveedor de OCR según entorno y modelo pedido.
 *   OCR_PROVIDER=claude   (default) modelo de visión de Claude; el modelo se puede elegir por request
 *   OCR_PROVIDER=oracle   para desarrollo sin clave: devuelve la columna OCR_ORACLE_COLUMN del layout estándar con ruido
 */
import "server-only";
import { ClaudeVisionOcr, OracleOcr, type OcrProvider } from "@kore/ocr";
import { getLayout } from "./locator";
import { DEFAULT_MODEL, isOcrModel, type OcrModelId } from "./models";

const providers = new Map<string, OcrProvider>();

export function defaultModel(): OcrModelId {
  const env = process.env.OCR_MODEL;
  return isOcrModel(env) ? env : DEFAULT_MODEL;
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
      throw new Error("Falta ANTHROPIC_API_KEY. Configurala en .env.local o usá OCR_PROVIDER=oracle para probar sin clave.");
    }
    provider = new ClaudeVisionOcr({ model: key });
  }
  providers.set(key, provider);
  return provider;
}
