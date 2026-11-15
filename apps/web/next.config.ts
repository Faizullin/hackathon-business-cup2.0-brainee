import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Independent local verification runs may use separate build output.
  distDir: process.env.BRAINEE_NEXT_DIR ?? ".next",
  async headers() {
    // Also constrain a remote iframe's own navigations to our origin.
    return ["/lab/:path*", "/game/:path*", "/explore/:path*"].map((source) => ({
      source,
      headers: [{ key: "Content-Security-Policy", value: "frame-src 'self'" }],
    }));
  },
  transpilePackages: [
    "@brainee/brainy",
    "@brainee/core",
    "@brainee/db",
    "@brainee/films",
    "@brainee/games",
    "@brainee/ui",
  ],
};

export default nextConfig;
