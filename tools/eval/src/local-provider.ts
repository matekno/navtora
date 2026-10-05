/** The local reader for Node: @navtora/vision + the ONNX recognizer, with sharp to decode images. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as ort from "onnxruntime-node";
import { batchedRecognizer, LocalOcr, type LocalReadOptions, type OcrImage } from "@navtora/ocr";

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MODEL = path.resolve(here, "../../../apps/web/public/models/stam-crnn.onnx");

export async function createLocalOcr(modelPath = DEFAULT_MODEL, opts: LocalReadOptions = {}): Promise<LocalOcr> {
  const session = await ort.InferenceSession.create(modelPath, { intraOpNumThreads: 4 });
  const recognize = batchedRecognizer(async (data, dims) => {
    const out = await session.run({ ink: new ort.Tensor("float32", data, dims) });
    const t = out.logprobs!;
    return { data: t.data as Float32Array, dims: t.dims };
  });
  const decode = async (image: OcrImage) => {
    const { data, info } = await sharp(image.bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), width: info.width, height: info.height, channels: 3 as const };
  };
  return new LocalOcr(decode, recognize, opts);
}
