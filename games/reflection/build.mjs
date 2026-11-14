import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export async function buildGame(destination) {
  mkdirSync(destination, { recursive: true });
  mkdirSync(resolve(destination, "lib"), { recursive: true });

  // Upstream EaselJS runtime and Apache-2.0 license
  cpSync(resolve(root, "artifact/lib/easeljs.js"), resolve(destination, "lib/easeljs.js"));
  cpSync(resolve(root, "artifact/LICENSE"), resolve(destination, "LICENSE"));
  cpSync(resolve(root, "artifact/NOTICE"), resolve(destination, "NOTICE"));

  // Manifest and credits
  cpSync(resolve(root, "manifest.json"), resolve(destination, "manifest.json"));
  cpSync(resolve(root, "CREDITS.md"), resolve(destination, "CREDITS.md"));

  // Brainee host/learning session UI & bridge adapter
  cpSync(resolve(root, "index.html"), resolve(destination, "index.html"));
  cpSync(resolve(root, "session.css"), resolve(destination, "session.css"));
  cpSync(resolve(root, "session.js"), resolve(destination, "session.js"));
}
