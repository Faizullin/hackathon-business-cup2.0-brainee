import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const result = await build({
  entryPoints: ["packages/game-catalog/src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { manifests } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? files(path) : [path];
  });
const discovered = [
  ...readdirSync("packages/games/src")
    .filter((name) => name !== "kit" && statSync(`packages/games/src/${name}`).isDirectory())
    .map((name) => `packages/games/src/${name}`),
  ...readdirSync("games")
    .filter((name) => statSync(`games/${name}`).isDirectory())
    .map((name) => `games/${name}`),
];
if (new Set(manifests.map((game) => game.id)).size !== manifests.length)
  throw new Error("Duplicate game ids");
for (const dir of discovered) {
  const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8"));
  if (!manifests.some((game) => game.id === manifest.id))
    throw new Error(`Unregistered manifest: ${dir}`);
}
for (const game of manifests) {
  const path =
    game.runtime === "embedded"
      ? `games/${game.id}/manifest.json`
      : `packages/games/src/${game.id}/manifest.json`;
  if (JSON.parse(readFileSync(path)).id !== game.id) throw new Error(`Missing manifest ${game.id}`);
  const sourceFiles = game.runtime === "react" ? files(`packages/games/src/${game.id}`) : [];
  if (sourceFiles.reduce((sum, file) => sum + statSync(file).size, 0) > game.sizeBudgetBytes)
    throw new Error(`${game.id} exceeds source size budget`);
  if (game.runtime === "react") statSync(resolve(`packages/games/src/${game.id}`, game.entry));
  if (process.argv.includes("--assets") && game.runtime === "embedded") {
    const base = resolve(`apps/web/public/games/${game.id}`);
    const paths = files(base);
    if (paths.reduce((sum, file) => sum + statSync(file).size, 0) > game.sizeBudgetBytes)
      throw new Error(`${game.id} exceeds size budget`);
    for (const file of paths.filter((file) => /\.(html|css)$/.test(file))) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/(?:src=["']|url\(["']?)([^"')>\s]+)/g)) {
        if (/^(https?:)?\/\//.test(match[1])) throw new Error(`Foreign asset ${match[1]}`);
        statSync(resolve(dirname(file), match[1]));
      }
    }
    for (const picture of ["bear", "dog", "elephant", "pig", "rabbit"])
      statSync(resolve(base, `assets/pictures/${picture}.png`));
    statSync(resolve(base, "../bridge.js"));
  }
}
console.log(
  `Validated ${manifests.length} manifests${process.argv.includes("--assets") ? " and built assets" : ""}`,
);
