/** OCR models selectable in the camera screen. "local" reads on the phone; the others are Claude vision. */

export const OCR_MODELS = {
  local: { label: "Local" },
  "claude-opus-5": { label: "Opus 5" },
  "claude-sonnet-5": { label: "Sonnet 5" },
} as const;

export type OcrModelId = keyof typeof OCR_MODELS;
export type ClaudeModelId = Exclude<OcrModelId, "local">;

export const DEFAULT_MODEL: OcrModelId = "local";
/** used when a local reading is not enough and the user asks for a second opinion */
export const FALLBACK_MODEL: ClaudeModelId = "claude-sonnet-5";

export function isOcrModel(v: unknown): v is OcrModelId {
  return typeof v === "string" && v in OCR_MODELS;
}

export function isClaudeModel(v: unknown): v is ClaudeModelId {
  return isOcrModel(v) && v !== "local";
}

export function modelLabel(id: string | undefined): string {
  if (!id) return "";
  if (id === "stam-crnn") return OCR_MODELS.local.label;
  for (const [key, m] of Object.entries(OCR_MODELS)) {
    if (id === key || id.startsWith(key)) return m.label;
  }
  return id;
}
