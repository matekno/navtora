import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kore/core", "@kore/data", "@kore/ocr"],
  // el matcher y los datos viven en el servidor; nada de esto va al cliente
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
