import type { es } from "./es";
import type { Locale } from "./locales";

/** Dictionary shape, derived from the Spanish one. */
export type Dictionary = Omit<typeof es, "lang"> & { lang: Locale };
