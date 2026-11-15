import { spawn, spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { build } from "esbuild";
import { discoverGames } from "./discover-games.mjs";
import { importTs } from "./tsx-import.mjs";

const args = process.argv.slice(2);
const remote = args[0] === "--dir";
const folder = remote && args[1] ? resolve(args[1]) : null;
const spec = remote && args[2] === "--spec" && args[3] ? resolve(args[3]) : null;
if (remote && (!folder || (args.length !== 2 && !(args.length === 4 && spec))))
  throw new Error("Usage: test:game --dir <build-folder> [--spec <interaction-spec>]");
const all = args[0] === "--all";
let selected;
if (folder) {
  const { loadBuild, validateBuild } = await importTs("./publish-remote.ts");
  selected = [{ manifest: validateBuild(await loadBuild(folder)), dir: folder }];
} else {
  selected = discoverGames().filter((g) => g.runtime === "embedded" && (all || g.id === args[0]));
  if (!selected.length)
    throw new Error("Use test:game <embedded-id>, test:game --dir <build-folder>, or test:games");
  const built = spawnSync(
    process.execPath,
    ["scripts/build-games.mjs", ...selected.map((g) => g.id)],
    { stdio: "inherit" },
  );
  if (built.status !== 0) process.exit(built.status ?? 1);
}
const host = await build({
  entryPoints: ["apps/web/e2e-games/host.ts"],
  bundle: true,
  format: "esm",
  write: false,
  target: "safari15",
});
const catalog = selected.map((g) => ({
  ...g.manifest,
  scored: g.manifest.scored ?? g.manifest.kind === "dev",
}));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    if (path === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated game test</title><body style="margin:0"><script type="module" src="/host.js"></script></body></html>',
      );
      return;
    }
    if (path === "/host.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(host.outputFiles[0].contents);
      return;
    }
    const game = catalog.find((g) => path === `/manifest/${g.id}.json`);
    if (game) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(game));
      return;
    }
    const root = folder ?? resolve("apps/web/public");
    const prefix = folder ? catalog[0].entry.slice(0, -"index.html".length) : "/";
    if (!path.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(root, path.slice(prefix.length));
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const start = performance.now();
try {
  const child = spawn(
    "pnpm",
    [
      "--filter",
      "@brainee/web",
      "exec",
      "playwright",
      "test",
      "--config",
      "playwright.games.config.ts",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        GAME_TEST_URL: `http://127.0.0.1:${port}`,
        GAME_TEST_IDS: catalog.map((g) => g.id).join(","),
        GAME_TEST_REMOTE: folder ? "1" : "0",
        GAME_TEST_REMOTE_ID: folder ? catalog[0].id : "",
        GAME_TEST_SPEC: spec ?? "",
      },
    },
  );
  const stop = () => child.kill("SIGTERM");
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const code = await new Promise((resolve) => child.once("exit", resolve));
  process.exitCode = typeof code === "number" ? code : 1;
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  console.log(`Game tests (excluding build): ${((performance.now() - start) / 1000).toFixed(1)}s`);
}
