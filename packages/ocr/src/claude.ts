/**
 * OCR con un modelo de visión de Claude. El modelo sólo transcribe lo que ve;
 * la posición y la confianza las decide el matcher de @kore/core.
 *
 * Para ubicarse alcanzan las primeras líneas de la columna, así que por defecto
 * se transcriben sólo `maxLines` líneas desde arriba y se cuenta el total. Eso
 * recorta la salida, que es lo que domina la latencia y el costo.
 *
 * Medido sobre el sefer de Shannon, 5 columnas cada variante, todas correctas:
 *   columna completa, esfuerzo medium: 52 s, 3500 tokens de salida, CER 0,19 %
 *   14 líneas, esfuerzo medium:        24 s, 1100 tokens de salida
 *   14 líneas, esfuerzo low:           15 s,  450 tokens de salida, CER 0,38 %
 *   14 líneas, low, claude-sonnet-5:   12 s,  420 tokens de salida, CER 0,60 %
 * Por eso el esfuerzo por defecto es low.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { OcrImage, OcrOutput, OcrProvider } from "./provider";

export const OCR_PROMPT_VERSION = "2026-09-06.2";

export const OcrResultSchema = z.object({
  lines: z
    .array(z.string())
    .describe("Hebrew consonantal text of each transcribed line, in visual order from the top; words separated by single spaces; '?' for each unreadable letter"),
  uncertainLines: z.array(z.number().int()).describe("0-based indexes into lines that are doubtful or only partially visible"),
  gapBeforeLines: z
    .array(z.object({ line: z.number().int(), gap: z.enum(["partial", "full"]) }))
    .describe("lines preceded by blank space: partial = blank stretch inside the line, full = previous line ended early or a blank line precedes"),
  lineCountVisible: z.number().int().min(0).describe("total number of text lines visible in the column, including lines not transcribed"),
});

function systemPrompt(maxLines: number): string {
  return `You transcribe photographs of a Sefer Torah column: Hebrew square scribal script (STA"M) written by hand on parchment, without vowels or punctuation.

Transcribe the first ${maxLines} fully visible text lines, counting from the top of the column, in visual order. If fewer lines are visible, transcribe those. Then count every text line visible in the column, transcribed or not, in lineCountVisible.

Rules:
- Output Hebrew consonantal letters only. No nikkud, no cantillation marks, no punctuation, no maqaf.
- Preserve final letter forms (ך ם ן ף ץ) as written.
- Separate words with a single space, following the spacing on the parchment.
- Do not complete, correct, or fill in text from your knowledge of the Bible. Read the ink, do not recall the text. If the parchment shows a word that differs from what you expect, write what is on the parchment. If a letter is unreadable write "?" in its place. If a whole word is unreadable write "?" for it.
- If a line is cut off by the edge of the photo, transcribe only the visible part and list it in uncertainLines.
- Decorative crowns (tagin), enlarged or small letters, and stitching are not text.

Return only the JSON object described by the schema.`;
}

export type OcrEffort = "low" | "medium" | "high";

export interface ClaudeOcrOptions {
  model?: string;
  effort?: OcrEffort;
  apiKey?: string;
  maxTokens?: number;
  /** líneas a transcribir desde arriba; 0 o Infinity para toda la columna */
  maxLines?: number;
}

export function parseEffort(v: string | undefined, fallback: OcrEffort = "low"): OcrEffort {
  return v === "low" || v === "medium" || v === "high" ? v : fallback;
}

export class ClaudeVisionOcr implements OcrProvider {
  readonly name = "claude";
  readonly model: string;
  readonly effort: OcrEffort;
  readonly maxLines: number;
  private readonly client: Anthropic;
  private readonly maxTokens: number;

  constructor(opts: ClaudeOcrOptions = {}) {
    this.client = opts.apiKey ? new Anthropic({ apiKey: opts.apiKey }) : new Anthropic();
    this.model = opts.model ?? process.env.OCR_MODEL ?? "claude-opus-5";
    this.effort = opts.effort ?? parseEffort(process.env.OCR_EFFORT);
    const envLines = Number(process.env.OCR_MAX_LINES);
    const lines = opts.maxLines ?? (Number.isFinite(envLines) && envLines > 0 ? envLines : 14);
    this.maxLines = lines > 0 && Number.isFinite(lines) ? lines : 60;
    this.maxTokens = opts.maxTokens ?? 8000;
  }

  /** identifica la configuración para la caché del eval */
  get cacheSalt(): string {
    return `${this.model}|${this.effort}|${this.maxLines}|${OCR_PROMPT_VERSION}`;
  }

  async recognize(image: OcrImage): Promise<OcrOutput> {
    const t0 = Date.now();
    const data = Buffer.from(image.bytes).toString("base64");
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt(this.maxLines),
      output_config: { effort: this.effort, format: zodOutputFormat(OcrResultSchema) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: image.mime, data } },
            { type: "text", text: `Transcribe the first ${this.maxLines} lines of this Sefer Torah column and count the visible lines.` },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`El modelo rechazó la imagen: ${response.stop_details?.explanation ?? "sin explicación"}`);
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("La transcripción quedó cortada por el límite de tokens.");
    }
    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error("El modelo no devolvió una transcripción con el formato esperado.");
    }
    const uncertain = new Set(parsed.uncertainLines);
    const gaps = new Map(parsed.gapBeforeLines.map((g) => [g.line, g.gap] as const));
    return {
      result: {
        lines: parsed.lines.map((text, i) => ({ text, uncertain: uncertain.has(i), gapBefore: gaps.get(i) ?? "none" })),
        lineCountVisible: parsed.lineCountVisible,
      },
      meta: {
        provider: this.name,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        ms: Date.now() - t0,
      },
    };
  }
}
