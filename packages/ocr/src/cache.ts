/**
 * Caché en disco de resultados de OCR por hash de imagen, modelo y versión del
 * prompt. Sólo para evaluación local: la app nunca persiste imágenes ni lecturas.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { OcrImage, OcrOutput, OcrProvider } from "./provider";

export function imageHash(image: OcrImage, salt = ""): string {
  return createHash("sha256").update(image.bytes).update(salt).digest("hex");
}

export class DiskCachedOcr implements OcrProvider {
  readonly name: string;

  constructor(
    private readonly inner: OcrProvider,
    private readonly dir: string,
    private readonly salt: string,
  ) {
    this.name = `${inner.name}+cache`;
    fs.mkdirSync(dir, { recursive: true });
  }

  async recognize(image: OcrImage): Promise<OcrOutput> {
    const key = imageHash(image, this.salt);
    const file = path.join(this.dir, `${key}.json`);
    if (fs.existsSync(file)) {
      const cached = JSON.parse(fs.readFileSync(file, "utf8")) as OcrOutput;
      return { ...cached, meta: { ...cached.meta, cached: true, ms: 0 } };
    }
    const out = await this.inner.recognize(image);
    fs.writeFileSync(file, JSON.stringify(out, null, 1));
    return out;
  }
}
