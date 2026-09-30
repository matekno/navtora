/** OCR models selectable in the camera screen. */

export const OCR_MODELS = {
  "claude-opus-5": { label: "Opus 5" },
  "claude-sonnet-5": { label: "Sonnet 5" },
} as const;

export type OcrModelId = keyof typeof OCR_MODELS;

export const DEFAULT_MODEL: OcrModelId = "claude-opus-5";

export function isOcrModel(v: unknown): v is OcrModelId {
  return typeof v === "string" && v in OCR_MODELS;
}

export function modelLabel(id: string | undefined): string {
  if (!id) return "";
  for (const [key, m] of Object.entries(OCR_MODELS)) {
    if (id === key || id.startsWith(key)) return m.label;
  }
  return id;
}
