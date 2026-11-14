import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname } from "node:path";
import type { FullConfig } from "@playwright/test";

export default async function cleanup(config: FullConfig) {
  const path: unknown = config.metadata.databasePath;
  if (
    typeof path !== "string" ||
    dirname(path) !== tmpdir() ||
    !/^brainee-e2e-[a-f0-9-]+\.db$/.test(basename(path))
  )
    throw new Error("Unexpected e2e database path.");
  for (const suffix of ["", "-wal", "-shm"]) await rm(`${path}${suffix}`, { force: true });
}
