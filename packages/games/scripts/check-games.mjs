// Each game folder may import only its own files, ../kit, @brainee/core and npm packages.
// Keeps games self-contained so one can be promoted to its own package (D-10).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../src", import.meta.url));
const IMPORT = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;
const problems = [];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

for (const game of readdirSync(src).filter((n) => statSync(join(src, n)).isDirectory())) {
  for (const file of files(join(src, game))) {
    for (const [, spec] of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const internal = spec.startsWith("@brainee/") && spec !== "@brainee/core";
      const sibling = spec.startsWith("../") && !/^\.\.\/kit(\.ts)?$/.test(spec);
      if (internal || sibling) problems.push(`${relative(src, file)}: imports "${spec}"`);
    }
  }
}

if (problems.length) {
  console.error(`Game folders must be self-contained:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("check:games ok");
