import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@navtora/core", "@navtora/data", "@navtora/ocr", "@navtora/vision"],
  // a self-contained server for the Docker image; the monorepo root lets it trace the workspace packages
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
