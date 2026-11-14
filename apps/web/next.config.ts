import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@brainee/core", "@brainee/games", "@brainee/ui"],
};

export default nextConfig;
