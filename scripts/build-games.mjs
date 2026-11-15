// Port of GSP's replace-on-build package pipeline, driven by auto-discovery:
// every embedded game folder exports `buildGame(destination)` from its own build.mjs.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { writeGeneratedModules } from "./discover-games.mjs";

const discovered = writeGeneratedModules();
const ids = process.argv.slice(2);
for (const id of ids)
  if (!discovered.some((game) => game.id === id)) throw new Error(`Unknown game: ${id}`);
const games = ids.length ? discovered.filter((game) => ids.includes(game.id)) : discovered;
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

for (const game of games) {
  const out = join(destination, game.id);
  rmSync(out, { recursive: true, force: true });
  if (game.runtime === "embedded") {
    const script = join(game.dir, "build.mjs");
    if (!existsSync(script)) throw new Error(`${game.id}: embedded games need build.mjs`);
    const { buildGame } = await import(pathToFileURL(script).href);
    if (typeof buildGame !== "function")
      throw new Error(`${game.id}: build.mjs must export buildGame`);
    await buildGame(out);
  }
  // React games are bundled by Next; only their card image is served from public/.
  mkdirSync(out, { recursive: true });
  cpSync(join(game.dir, "thumbnail.svg"), join(out, "thumbnail.svg"));
}
console.log(`Built ${games.length} game folders into ${destination}`);
