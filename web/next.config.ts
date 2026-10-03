import path from "node:path";
import type { NextConfig } from "next";
// Validates environment variables when `next dev` or `next build` starts.
import "./lib/env";

const nextConfig: NextConfig = {
  // The Nuxt site keeps its own lockfile at the repo root until Phase 6; pin the
  // root so Turbopack does not infer the parent folder.
  turbopack: {
    root: path.join(__dirname),
    // Hero shaders live in .glsl files and are imported as strings.
    rules: { "*.glsl": { loaders: [require.resolve("raw-loader")], as: "*.js" } },
  },
  // Only Spanish exists until Phase 6, when next-intl negotiates the locale.
  async redirects() {
    return [{ source: "/", destination: "/es", permanent: false }];
  },
};

export default nextConfig;
