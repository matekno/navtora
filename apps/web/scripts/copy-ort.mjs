// Copies the ONNX Runtime Web files the local OCR loads at runtime into public/ort/.
// They come from node_modules, so they are not committed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// the package's exports hide package.json, so locate it through node_modules
const dist = path.resolve(here, "../node_modules/onnxruntime-web/dist");
const out = path.resolve(here, "../public/ort");
fs.mkdirSync(out, { recursive: true });
for (const f of ["ort.wasm.min.js", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  const src = path.join(dist, f);
  const dst = path.join(out, f);
  const stale = !fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size;
  if (stale) fs.copyFileSync(src, dst);
}
console.log(`onnxruntime-web assets in ${path.relative(process.cwd(), out)}`);
