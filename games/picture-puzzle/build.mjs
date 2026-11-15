import { cpSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhaserPackage } from "../../packages/engine-phaser/buildPhaserPackage.mjs";

const here = import.meta.dirname;
const PICTURES = ["bear", "dog", "elephant", "pig", "rabbit"];

/** Called by `pnpm games:build` with this game's public directory. */
export async function buildGame(destination) {
  await buildPhaserPackage({ packageDir: here });
  rmSync(destination, { recursive: true, force: true });
  cpSync(resolve(here, "dist"), destination, { recursive: true });
  for (const name of ["manifest.json", "CREDITS.md"])
    cpSync(resolve(here, name), resolve(destination, name));
  cpSync(resolve(here, "assets-src/animals/License.txt"), resolve(destination, "LICENSE-art.txt"));
  cpSync(resolve(here, "licenses"), resolve(destination, "licenses"), { recursive: true });
}

/** Called by `pnpm test:assets`: canvas-loaded pictures are not visible to the HTML/CSS scan. */
export function checkAssets(base) {
  for (const picture of PICTURES) statSync(resolve(base, `assets/pictures/${picture}.png`));
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await buildGame(process.argv[2] ?? resolve(here, "../../apps/web/public/games/picture-puzzle"));
