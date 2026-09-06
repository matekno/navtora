import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataNode } from "../../data/src/index";
import { DiskCachedOcr } from "../src/cache";
import { OracleOcr } from "../src/oracle";
import type { OcrImage, OcrOutput, OcrProvider } from "../src/provider";

const { layout } = loadDataNode();
const fakeImage: OcrImage = { bytes: new Uint8Array([1, 2, 3, 4]), mime: "image/jpeg" };

describe("OracleOcr", () => {
  it("devuelve las líneas consonánticas de la columna pedida", async () => {
    const ocr = new OracleOcr({ layout, columnOf: () => 50 });
    const { result, meta } = await ocr.recognize(fakeImage);
    expect(meta.provider).toBe("oracle");
    expect(result.lines.length).toBe(42);
    expect(result.lines[0]?.text.startsWith("ויאמר אלהם יוסף")).toBe(true);
    expect(result.lineCountVisible).toBe(42);
  });

  it("con ruido cambia el texto pero mantiene la cantidad de líneas", async () => {
    const clean = await new OracleOcr({ layout, columnOf: () => 50 }).recognize(fakeImage);
    const noisy = await new OracleOcr({ layout, columnOf: () => 50, charErrorRate: 0.3, seed: 7 }).recognize(fakeImage);
    expect(noisy.result.lines.length).toBeGreaterThanOrEqual(38);
    expect(noisy.result.lines.map((l) => l.text).join("\n")).not.toBe(clean.result.lines.map((l) => l.text).join("\n"));
  });
});

describe("DiskCachedOcr", () => {
  it("llama al proveedor una sola vez por imagen y marca el resultado cacheado", async () => {
    let calls = 0;
    const inner: OcrProvider = {
      name: "counter",
      async recognize(): Promise<OcrOutput> {
        calls++;
        return { result: { lines: [{ text: "בראשית ברא" }], lineCountVisible: 1 }, meta: { provider: "counter", ms: 5 } };
      },
    };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kore-ocr-cache-"));
    const cached = new DiskCachedOcr(inner, dir, "test");
    const a = await cached.recognize(fakeImage);
    const b = await cached.recognize(fakeImage);
    expect(calls).toBe(1);
    expect(a.meta.cached).toBeUndefined();
    expect(b.meta.cached).toBe(true);
    expect(b.result.lines[0]?.text).toBe("בראשית ברא");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
