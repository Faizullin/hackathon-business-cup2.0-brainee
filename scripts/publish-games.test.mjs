import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { zipSync } from "fflate";

const bundle = await build({
  entryPoints: ["scripts/publish-remote.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { publish, validateBuild } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
const manifest = {
  source: "remote",
  scored: false,
  id: "remote-test",
  version: "1.0.0",
  title: "Test",
  mode: "explore",
  minAge: 4,
  license: "MIT",
  sizeBudgetBytes: 10000,
  entry: "/g/remote-test/1.0.0/index.html",
  thumbnail: "/g/remote-test/1.0.0/thumbnail.svg",
  explore: {
    family: "phaser",
    viewport: "responsive",
    orientation: "any",
    audio: false,
    readiness: "bridge",
  },
};
const fixture = () => ({
  "manifest.json": Buffer.from(JSON.stringify(manifest)),
  "index.html": Buffer.from('<script src="main.js"></script>'),
  "main.js": Buffer.from('console.log("ready")'),
  "thumbnail.svg": Buffer.from('<svg viewBox="0 0 160 120"></svg>'),
});
test("rejects missing assets, absolute paths, foreign references and oversized builds", () => {
  assert.equal(validateBuild(fixture()).scored, false);
  for (const ref of ["https://evil.test/x.js", "/api/state", "../x.js", "absent.js"])
    assert.throws(() =>
      validateBuild({ ...fixture(), "index.html": Buffer.from(`<script src="${ref}"></script>`) }),
    );
  assert.throws(() => validateBuild({ ...fixture(), "../escape": Buffer.from("x") }));
  assert.throws(() => validateBuild({ ...fixture(), "large.dat": Buffer.alloc(11000) }));
  const missing = fixture();
  delete missing["index.html"];
  assert.throws(() => validateBuild(missing));
});
test("ZIP publishing is idempotent, immutable, supports disable and rollback", async () => {
  const dir = await mkdtemp(join(tmpdir(), "publish-test-"));
  try {
    const objects = new Map();
    const driver = {
      id: "fs",
      get: async (key) => objects.get(key) ?? null,
      put: async (key, data) => objects.set(key, Buffer.from(data)),
    };
    const archive = join(dir, "build.zip");
    await writeFile(archive, zipSync(fixture()));
    await publish(archive, {}, driver);
    const first = objects.get("catalog.json").toString();
    await publish(archive, {}, driver);
    assert.equal(objects.get("catalog.json").toString(), first);
    await publish(archive, { version: "2.0.0" }, driver);
    await publish("remote-test", { rollback: "1.0.0" }, driver);
    let rows = JSON.parse(objects.get("catalog.json"));
    assert.equal(rows.find((r) => r.enabled).version, "1.0.0");
    await publish("remote-test", { disable: true }, driver);
    rows = JSON.parse(objects.get("catalog.json"));
    assert.equal(
      rows.some((r) => r.enabled),
      false,
    );
    await publish("remote-test", { enable: true }, driver);
    assert.equal(JSON.parse(objects.get("catalog.json")).filter((r) => r.enabled).length, 1);
    await writeFile(archive, zipSync({ ...fixture(), "main.js": Buffer.from("changed") }));
    await assert.rejects(publish(archive, {}, driver), /immutable/);
    await writeFile(archive, zipSync({ ...fixture(), "../escape": Buffer.from("bad") }));
    await assert.rejects(publish(archive, {}, driver), /Unsafe/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
