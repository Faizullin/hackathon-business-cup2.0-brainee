// Validates every discovered game folder against the catalog schema, pinned sources and budgets.
// `--assets` additionally checks the built public output (run after `pnpm games:build`).
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { writeGeneratedModules } from "./discover-games.mjs";

const discovered = writeGeneratedModules();
const result = await build({
  entryPoints: ["packages/game-catalog/src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { manifests, previews, THUMBNAIL_MAX_BYTES } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const assets = process.argv.includes("--assets");
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? files(path) : [path];
  });
const catalog = [...manifests, ...previews];
if (new Set(catalog.map((game) => game.id)).size !== catalog.length)
  throw new Error("Duplicate game ids");
if (catalog.length !== discovered.length)
  throw new Error(`Catalog has ${catalog.length} games but ${discovered.length} folders exist`);

/** Card images: small, self-contained vector art (no text, scripts or outside references). */
function checkThumbnail(path) {
  const svg = readFileSync(path, "utf8");
  if (Buffer.byteLength(svg) > THUMBNAIL_MAX_BYTES)
    throw new Error(`${path} is over ${THUMBNAIL_MAX_BYTES} bytes`);
  if (!/^<svg[^>]*viewBox="0 0 (\d+) (\d+)"/.test(svg)) throw new Error(`${path}: needs a viewBox`);
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (Number(w) * 3 !== Number(h) * 4) throw new Error(`${path}: thumbnails are 4:3`);
  if (/<(text|script|image|foreignObject|style)\b|href=|url\(|@import|font-family/i.test(svg))
    throw new Error(`${path}: no text, scripts, styles or outside references`);
}

for (const folder of discovered) {
  const game = catalog.find((entry) => entry.id === folder.id);
  if (!game) throw new Error(`Unregistered manifest: ${folder.dir}`);
  const { dir } = folder;
  checkThumbnail(join(dir, "thumbnail.svg"));
  if (existsSync(`${dir}/sources.lock.json`)) {
    const lock = JSON.parse(readFileSync(`${dir}/sources.lock.json`, "utf8"));
    if (!/^[a-f0-9]{40}$/.test(lock.commit)) throw new Error("Unpinned source");
    for (const file of lock.files) {
      const content = readFileSync(`${dir}/artifact/${file.path}`);
      const blob = createHash("sha1")
        .update(`blob ${content.length}\0`)
        .update(content)
        .digest("hex");
      const hash = createHash("sha256").update(content).digest("hex");
      if (blob !== file.gitBlob || hash !== file.sha256)
        throw new Error(`Changed pinned artifact: ${file.path}`);
    }
  }
  if (folder.runtime === "react") {
    const sourceFiles = files(dir);
    if (sourceFiles.reduce((sum, file) => sum + statSync(file).size, 0) > game.sizeBudgetBytes)
      throw new Error(`${game.id} exceeds source size budget`);
    statSync(resolve(dir, game.entry));
  }
  if (!assets) continue;
  const base = resolve(`apps/web/public/games/${game.id}`);
  checkThumbnail(join(base, "thumbnail.svg"));
  if (folder.runtime !== "embedded") continue;
  const paths = files(base);
  if (paths.reduce((sum, file) => sum + statSync(file).size, 0) > game.sizeBudgetBytes)
    throw new Error(`${game.id} exceeds size budget`);
  for (const file of paths.filter((file) => /\.(html|css)$/.test(file))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/(?:src=["']|url\(["']?)([^"')>\s]+)/g)) {
      if (/^(https?:)?\/\//.test(match[1])) throw new Error(`Foreign asset ${match[1]}`);
      if (match[1].startsWith("data:")) continue;
      statSync(resolve(dirname(file), match[1]));
    }
  }
  // Optional per-game hook for assets loaded from code (canvas images, audio).
  const script = join(dir, "build.mjs");
  const { checkAssets } = await import(pathToFileURL(script).href);
  checkAssets?.(base);
  statSync(resolve(base, "../bridge.js"));
}
console.log(
  `Validated ${manifests.length} learning manifests and ${previews.length} previews with thumbnails${assets ? " and built assets" : ""}`,
);
