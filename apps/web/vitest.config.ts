import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // the real module throws outside a React Server Components bundle
      "server-only": path.resolve(__dirname, "test/server-only.ts"),
    },
  },
  test: { include: ["test/**/*.test.ts"], testTimeout: 60_000 },
});
