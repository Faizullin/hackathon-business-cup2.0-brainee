import { bundleWebPackage } from "../../scripts/bundle-web-package.mjs";

/**
 * Shared builder inherited by all `packages/phaser-*-game` packages.
 * Bundles the package's TypeScript entry `src/main.ts` together with Phaser
 * into `<packageDir>/dist/index.js`, next to its `src/index.html` and assets.
 */
export function buildPhaserPackage({ packageDir }) {
  return bundleWebPackage({ packageDir, label: "phaser-core" });
}
