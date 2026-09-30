import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@navtora/core", "@navtora/data", "@navtora/ocr"],
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
