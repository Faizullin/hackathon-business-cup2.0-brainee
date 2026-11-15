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

test("deployed target plans without writes, synchronizes only games, and repairs repeat publications", async () => {
  const { importTs } = await import("./tsx-import.mjs");
  const { parseOptions, publishTarget, targetEnvironment } = await importTs("./publish-target.ts");
  const { fsDriver } = await importTs("../packages/game-catalog/src/storage.ts");
  const { getDatabaseConfig } = await importTs("../packages/db/src/config.ts");
  const { openDatabase } = await importTs("../packages/db/src/client.ts");
  const { resetDatabase } = await importTs("../packages/db/scripts/database-tools.ts");
  const dir = await mkdtemp(join(tmpdir(), "publish-deployed-"));
  let connection;
  try {
    assert.throws(() => parseOptions(["test", "--target", "deployed"]), /--yes/);
    const databaseUrl = `file:${join(dir, "test.db")}`;
    await resetDatabase(getDatabaseConfig(databaseUrl));
    connection = await openDatabase(getDatabaseConfig(databaseUrl));
    const familyBefore = await connection.client.execute("SELECT * FROM families");
    const scored = {
      source: "remote",
      scored: true,
      id: "remote-test",
      version: "1.0.0",
      kind: "dev",
      title: "Remote scoring",
      engine: "html",
      runtime: "embedded",
      entry: "/g/remote-test/1.0.0/index.html",
      skills: { main: "logic" },
      weights: { logic: 1 },
      minAge: 4,
      levels: 1,
      roundsPerSession: 4,
      bridge: { protocol: 2, contract: "remote-test@1" },
      sizeBudgetBytes: 10000,
      license: "MIT",
      thumbnail: "/g/remote-test/1.0.0/thumbnail.svg",
    };
    const archive = join(dir, "scored.zip");
    await writeFile(
      archive,
      zipSync({ ...fixture(), "manifest.json": Buffer.from(JSON.stringify(scored)) }),
    );
    const driver = fsDriver(join(dir, "objects"));
    const env = { DATABASE_URL: databaseUrl };
    const options = parseOptions([archive, "--target", "deployed", "--yes"]);
    const lines = [];
    await publishTarget({ ...options, dryRun: true }, env, driver, (line) => lines.push(line));
    assert.equal(await driver.get("catalog.json"), null);
    assert.equal(
      (await connection.client.execute("SELECT * FROM games WHERE id='remote-test'")).rows.length,
      0,
    );
    assert(lines.some((line) => line.includes("brainy/catalog.json")));
    await publishTarget(options, env, driver, () => {});
    await publishTarget(options, env, driver, () => {});
    assert.equal(
      (await connection.client.execute("SELECT * FROM games WHERE id='remote-test'")).rows.length,
      1,
    );
    await publishTarget({ ...options, input: "remote-test", disable: true }, env, driver, () => {});
    assert.equal(
      (await connection.client.execute("SELECT enabled FROM games WHERE id='remote-test'")).rows[0]
        .enabled,
      0,
    );
    await publishTarget({ ...options, input: "remote-test", enable: true }, env, driver, () => {});
    assert.equal(
      (await connection.client.execute("SELECT enabled FROM games WHERE id='remote-test'")).rows[0]
        .enabled,
      1,
    );
    await publishTarget({ ...options, version: "2.0.0" }, env, driver, () => {});
    await publishTarget(
      { ...options, input: "remote-test", rollback: "1.0.0" },
      env,
      driver,
      () => {},
    );
    const row = (
      await connection.client.execute(
        "SELECT enabled,runtime_url FROM games WHERE id='remote-test'",
      )
    ).rows[0];
    assert.equal(row.enabled, 1);
    assert.equal(row.runtime_url, "/g/remote-test/1.0.0/index.html");
    assert.deepEqual(
      (await connection.client.execute("SELECT * FROM families")).rows,
      familyBefore.rows,
    );
    const localEnvFile = join(dir, "cloud.env");
    await writeFile(localEnvFile, "DATABASE_URL=libsql://do-not-contact.invalid\n");
    await assert.rejects(
      targetEnvironment(parseOptions([archive, "--db-env", localEnvFile])),
      /Local target/,
    );
  } finally {
    connection?.client.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("R2 alias configuration keeps every operation under brainy/", async () => {
  const { importTs } = await import("./tsx-import.mjs");
  const { storageDriver, r2ObjectKey } = await importTs("../packages/game-catalog/src/storage.ts");
  assert.throws(() => r2ObjectKey("../catalog.json"));
  assert.throws(() => r2ObjectKey("another-project/private.json"));
  const urls = [];
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      urls.push(String(url));
      return new Response("[]");
    };
    const driver = storageDriver("r2", {
      R2_ACCOUNT_ID: "test",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET_NAME: "bucket",
      R2_ENDPOINT_URL: "https://test.invalid",
    });
    await driver.get("catalog.json");
    await driver.put("games/test/1.0.0/index.html", Buffer.from("hello"));
    assert.deepEqual(urls, [
      "https://test.invalid/bucket/brainy/catalog.json",
      "https://test.invalid/bucket/brainy/games/test/1.0.0/index.html",
    ]);
  } finally {
    globalThis.fetch = original;
  }
});
