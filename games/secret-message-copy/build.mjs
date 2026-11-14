import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function buildGame(destination) {
  mkdirSync(destination, { recursive: true });
  cpSync(resolve(here, "artifact"), destination, { recursive: true });
  for (const file of ["index.html", "session.js", "session.css", "manifest.json", "CREDITS.md"]) {
    cpSync(resolve(here, file), resolve(destination, file));
  }
}
