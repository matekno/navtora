import type { OcrResult } from "@kore/core";

export interface OcrImage {
  bytes: Uint8Array;
  mime: "image/jpeg" | "image/png" | "image/webp";
}

export interface OcrMeta {
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  ms: number;
  cached?: boolean;
}

export interface OcrOutput {
  result: OcrResult;
  meta: OcrMeta;
}

/** Cualquier cosa que convierta una foto de columna en líneas de texto hebreo. */
export interface OcrProvider {
  readonly name: string;
  recognize(image: OcrImage): Promise<OcrOutput>;
}
