import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Independent local verification runs may use separate build output.
  distDir: process.env.BRAINEE_NEXT_DIR ?? ".next",
  transpilePackages: [
    "@brainee/brainy",
    "@brainee/core",
    "@brainee/db",
    "@brainee/games",
    "@brainee/ui",
  ],
};

export default nextConfig;
