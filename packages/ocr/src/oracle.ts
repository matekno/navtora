/**
 * Proveedor "oráculo" para evaluación: no mira la imagen. Devuelve el texto
 * real de una columna del layout estándar, opcionalmente con ruido simulado.
 * Sirve para probar la cañería completa sin gastar en OCR y para medir el
 * matcher aislado del reconocimiento.
 */
import { noisyLines, tokenizeHebrew, type LayoutData } from "@kore/core";
import type { OcrImage, OcrOutput, OcrProvider } from "./provider";

export interface OracleOptions {
  layout: LayoutData;
  /** función que, dada la imagen, dice qué columna es; en eval viene del nombre del archivo */
  columnOf: (image: OcrImage) => number;
  charErrorRate?: number;
  seed?: number;
}

export class OracleOcr implements OcrProvider {
  readonly name = "oracle";
  constructor(private readonly opts: OracleOptions) {}

  async recognize(image: OcrImage): Promise<OcrOutput> {
    const column = this.opts.columnOf(image);
    const col = this.opts.layout.columns[column - 1];
    if (!col) throw new Error(`columna fuera de rango: ${column}`);
    const clean = col.lines.map((l) => tokenizeHebrew(l.text).join(" "));
    const lines = this.opts.charErrorRate ? noisyLines(clean, { charErrorRate: this.opts.charErrorRate, seed: this.opts.seed ?? column }) : clean;
    return {
      result: {
        lines: lines.map((text, i) => ({ text, uncertain: false, gapBefore: col.lines[i]?.petucha ? "full" : col.lines[i]?.gap ? "partial" : "none" })),
        lineCountVisible: col.lines.length,
      },
      meta: { provider: this.name, ms: 0 },
    };
  }
}
