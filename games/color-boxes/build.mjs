import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPhaserPackage } from "../../packages/engine-phaser/buildPhaserPackage.mjs";

const here = import.meta.dirname;

/** Called by `pnpm games:build` with this game's public directory. */
export async function buildGame(destination) {
  await buildPhaserPackage({ packageDir: here });
  rmSync(destination, { recursive: true, force: true });
  cpSync(resolve(here, "dist"), destination, { recursive: true });
  for (const name of ["preview.json", "CREDITS.md"])
    cpSync(resolve(here, name), resolve(destination, name));
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await buildGame(process.argv[2] ?? resolve(here, "../../apps/web/public/games/color-boxes"));
