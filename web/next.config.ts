import type { NextConfig } from "next";
// Validates environment variables when `next dev` or `next build` starts.
import "./lib/env";

const nextConfig: NextConfig = {
  // Only Spanish exists until Phase 6, when next-intl negotiates the locale.
  async redirects() {
    return [{ source: "/", destination: "/es", permanent: false }];
  },
};

export default nextConfig;
