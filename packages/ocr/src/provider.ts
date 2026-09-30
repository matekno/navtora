import type { OcrResult } from "@navtora/core";

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

/** Turns a photo of a column into lines of Hebrew text. */
export interface OcrProvider {
  readonly name: string;
  recognize(image: OcrImage): Promise<OcrOutput>;
}

export type OcrErrorCode = "refusal" | "truncated" | "bad-format";

/** Provider failure with a code the app can localize. */
export class OcrError extends Error {
  constructor(
    readonly code: OcrErrorCode,
    message: string,
    /** extra detail from the provider, e.g. a refusal explanation */
    readonly detail?: string,
  ) {
    super(message);
    this.name = "OcrError";
  }
}
