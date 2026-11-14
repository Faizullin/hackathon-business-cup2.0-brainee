import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

/**
 * Builds a game package written in TypeScript into `<packageDir>/dist/`:
 * bundles `src/main.ts` (and any CSS it imports) to `index.js` / `index.css`,
 * and copies `src/index.html` and `assets/` next to them.
 */
export async function bundleWebPackage({ packageDir, label }) {
  const distDir = path.join(packageDir, "dist");
  const srcDir = path.join(packageDir, "src");
  const assetsDir = path.join(packageDir, "assets");

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  await build({
    entryPoints: { index: path.join(srcDir, "main.ts") },
    outdir: distDir,
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2020", "safari15"],
    legalComments: "linked",
    logLevel: "warning",
  });

  fs.copyFileSync(path.join(srcDir, "index.html"), path.join(distDir, "index.html"));
  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.join(distDir, "assets"), { recursive: true });
  }

  const pkgName = path.basename(packageDir);
  console.log(`   ✔ [${label}] Built ${pkgName} -> packages/${pkgName}/dist/`);
}
