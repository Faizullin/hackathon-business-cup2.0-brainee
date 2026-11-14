// Port of GSP's replace-on-build package pipeline.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { buildPhaserPackage } from "../packages/engine-phaser/buildPhaserPackage.mjs";

const destination = resolve("apps/web/public/games");
mkdirSync(destination, { recursive: true });
await build({
  entryPoints: ["packages/game-bridge/src/global.ts"],
  outfile: `${destination}/bridge.js`,
  bundle: true,
  minify: true,
  format: "iife",
  target: "safari15",
});
await buildPhaserPackage({ packageDir: resolve("games/picture-puzzle") });
rmSync(`${destination}/picture-puzzle`, { recursive: true, force: true });
cpSync("games/picture-puzzle/dist", `${destination}/picture-puzzle`, { recursive: true });
for (const name of ["manifest.json", "CREDITS.md"])
  cpSync(`games/picture-puzzle/${name}`, `${destination}/picture-puzzle/${name}`);
cpSync(
  "games/picture-puzzle/assets-src/animals/License.txt",
  `${destination}/picture-puzzle/LICENSE-art.txt`,
);

cpSync("games/picture-puzzle/licenses", `${destination}/picture-puzzle/licenses`, {
  recursive: true,
});
