import path from "node:path";
import type { NextConfig } from "next";
// Validates environment variables when `next dev` or `next build` starts.
import "./lib/env";

const nextConfig: NextConfig = {
  // Pin the root so Turbopack never infers a parent folder with another lockfile.
  turbopack: {
    root: path.join(__dirname),
    // Hero shaders live in .glsl files and are imported as strings.
    rules: { "*.glsl": { loaders: [require.resolve("raw-loader")], as: "*.js" } },
  },
};

export default nextConfig;
