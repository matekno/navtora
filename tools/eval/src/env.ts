/**
 * Carga ANTHROPIC_API_KEY, OCR_MODEL y OCR_EFFORT desde apps/web/.env.local
 * cuando no vienen en el entorno, para que el eval use la misma configuración
 * que la app. El archivo está fuera de git.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, "../../../apps/web/.env.local");

if (fs.existsSync(envFile)) {
  for (const raw of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (["ANTHROPIC_API_KEY", "OCR_MODEL", "OCR_EFFORT"].includes(key) && !process.env[key] && value) {
      process.env[key] = value;
    }
  }
}
