import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { manifests } from "./index";
import { gameSandbox, remoteCatalogSchema, remoteFileUrl, remoteManifestSchema } from "./remote";
import { fsDriver, readRemoteCatalog, sha256, signedHeaders } from "./storage";

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
it("keeps unscored manifests free of reward metadata and paths pinned to their version", () => {
  expect(remoteManifestSchema.parse(manifest).scored).toBe(false);
  for (const bad of [
    { weights: { logic: 1 } },
    { entry: "https://evil.test/index.html" },
    { thumbnail: "/g/remote-test/2.0.0/thumbnail.svg" },
    { source: "builtin" },
  ])
    expect(remoteManifestSchema.safeParse({ ...manifest, ...bad }).success).toBe(false);
  expect(
    remoteManifestSchema.safeParse({
      ...manifest,
      thumbnail: "/g/remote-test/1.0.0/art/thumbnail.webp",
    }).success,
  ).toBe(true);
  expect(
    remoteManifestSchema.safeParse({
      ...manifest,
      thumbnail: "/g/remote-test/1.0.0/../thumbnail.webp",
    }).success,
  ).toBe(false);
  expect(gameSandbox("remote")).toBe("allow-scripts");
  expect(gameSandbox("builtin")).toBe("allow-scripts allow-same-origin");
  expect(remoteFileUrl("remote-test", "1.0.0", "assets/a.png")).toBe(
    "/g/remote-test/1.0.0/assets/a.png",
  );
  for (const path of ["../x", "/x", "a//b", "https://x", "%2e%2e/a", "a\\b"])
    expect(() => remoteFileUrl("remote-test", "1.0.0", path)).toThrow();
});
it("round trips checked catalog objects and file hashes using the filesystem driver", async () => {
  const dir = await mkdtemp(join(tmpdir(), "remote-store-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const driver = fsDriver(dir);
  expect(await readRemoteCatalog(driver)).toEqual([]);
  await driver.put("games/remote-test/1.0.0/index.html", Buffer.from("hello"));
  expect(sha256((await driver.get("games/remote-test/1.0.0/index.html")) ?? "")).toBe(
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
  await expect(driver.get("../escape")).rejects.toThrow();
  const row = {
    id: manifest.id,
    version: manifest.version,
    enabled: true,
    driver: "fs",
    key: "games/remote-test/1.0.0",
    manifest,
    sha256: { "index.html": sha256("hello"), "thumbnail.svg": sha256("svg") },
  };
  await driver.put("catalog.json", Buffer.from(JSON.stringify([row])));
  expect(await readRemoteCatalog(driver)).toHaveLength(1);
  expect(remoteCatalogSchema.safeParse([row, row]).success).toBe(false);
  expect(remoteCatalogSchema.safeParse([{ ...row, key: "https://evil.test" }]).success).toBe(false);
});
it("SigV4 signs method, path and payload without putting credentials in a URL", () => {
  const date = new Date("2026-11-15T00:00:00Z");
  const url = new URL("https://example.r2.cloudflarestorage.com/bucket/catalog.json");
  const headers = signedHeaders("GET", url, new Uint8Array(), "test-access", "test-secret", date);
  expect(headers["x-amz-date"]).toBe("20261115T000000Z");
  expect(headers.Authorization).toContain("20261115/auto/s3/aws4_request");
  expect(headers.Authorization).not.toContain("test-secret");
  expect(
    signedHeaders("PUT", url, Buffer.from("different"), "test-access", "test-secret", date)
      .Authorization,
  ).not.toBe(headers.Authorization);
});

it("rejects scoring-rule changes across versions before publication", () => {
  const id = "remote-scored";
  const scored = {
    ...manifests[0],
    source: "remote",
    scored: true,
    runtime: "embedded",
    id,
    version: "1.0.0",
    entry: `/g/${id}/1.0.0/index.html`,
    thumbnail: `/g/${id}/1.0.0/thumbnail.svg`,
    bridge: { protocol: 2, contract: `${id}@1` },
  };
  const first = {
    id,
    version: "1.0.0",
    enabled: true,
    driver: "fs",
    key: `games/${id}/1.0.0`,
    sha256: { "index.html": "a".repeat(64), "thumbnail.svg": "b".repeat(64) },
    manifest: scored,
  };
  const second = {
    ...first,
    version: "2.0.0",
    enabled: false,
    key: `games/${id}/2.0.0`,
    manifest: {
      ...scored,
      version: "2.0.0",
      entry: `/g/${id}/2.0.0/index.html`,
      thumbnail: `/g/${id}/2.0.0/thumbnail.svg`,
      roundsPerSession: 999,
    },
  };
  expect(remoteCatalogSchema.safeParse([first, second]).success).toBe(false);
});
