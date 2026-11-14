import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { getDatabaseConfig } from "./config";

const workspace = resolve(process.cwd(), "../..");

describe("local database paths", () => {
  it("uses the same default file from the root, DB package and web app", () => {
    const expected = resolve(workspace, "data/dev.db");
    for (const cwd of [
      workspace,
      resolve(workspace, "packages/db"),
      resolve(workspace, "apps/web"),
    ]) {
      expect(getDatabaseConfig("file:./data/dev.db", cwd).path).toBe(expected);
    }
  });

  it("resolves relative overrides from the workspace root", () => {
    expect(getDatabaseConfig("file:./data/alternate.db").path).toBe(
      resolve(workspace, "data/alternate.db"),
    );
  });

  it("supports an absolute deployment path without requiring a workspace at runtime", () => {
    const absolute = resolve("/data/brainee.db");
    expect(getDatabaseConfig(`file:${absolute}`, "/")).toEqual({
      isRemote: false,
      authToken: undefined,
      path: absolute,
      url: pathToFileURL(absolute).href,
    });
  });

  it("supports remote libsql database URLs with optional auth tokens", () => {
    expect(getDatabaseConfig("libsql://demo.turso.io", "/", "test-token")).toEqual({
      isRemote: true,
      authToken: "test-token",
      path: "",
      url: "libsql://demo.turso.io",
    });
  });

  it.each(["", "file:", "file::memory:", "postgres://localhost/db", "mysql://localhost/db"])(
    "rejects unsupported database location %j",
    (url) => {
      expect(() => getDatabaseConfig(url)).toThrow(/local SQLite file/);
    },
  );

  it("rejects URL options rather than silently targeting another file", () => {
    expect(() => getDatabaseConfig("file:///tmp/demo.db?mode=ro")).toThrow(/query parameters/);
    expect(() => getDatabaseConfig("file:./data/demo.db#fragment")).toThrow(/special characters/);
  });
});
