import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { type FileHandle, open, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "../src/client";
import type { DatabaseConfig } from "../src/config";
import { refreshDemo, seedDemo } from "../src/seed";

const require = createRequire(import.meta.url);
const packageDirectory = fileURLToPath(new URL("..", import.meta.url));

export function runDrizzle(config: DatabaseConfig, command: "push" | "studio" = "push") {
  if (config.path) {
    mkdirSync(dirname(config.path), { recursive: true });
  }
  // Resolve the installed CLI; never invoke a shell or download a tool at runtime.
  const cli = join(dirname(require.resolve("drizzle-kit")), "bin.cjs");
  return (
    execFileSync(process.execPath, [cli, command, "--config", "drizzle.config.ts"], {
      cwd: packageDirectory,
      env: {
        ...process.env,
        DATABASE_URL: config.url,
        ...(config.authToken ? { DATABASE_AUTH_TOKEN: config.authToken } : {}),
      },
      encoding: "utf8",
      stdio: command === "studio" ? "inherit" : "pipe",
    }) ?? ""
  );
}

export async function seedDatabase(config: DatabaseConfig, refresh = false) {
  const connection = await openDatabase(config);
  try {
    await (refresh ? refreshDemo : seedDemo)(connection.db);
  } finally {
    connection.client.close();
  }
}

async function assertResetTarget(path: string) {
  let handle: FileHandle;
  try {
    handle = await open(path, "r");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  try {
    const header = Buffer.alloc(16);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (bytesRead > 0 && header.toString() !== "SQLite format 3\0") {
      throw new Error("Refusing to reset a file that is not a SQLite database.");
    }
  } finally {
    await handle.close();
  }
}

export async function resetDatabase(config: DatabaseConfig) {
  if (config.isRemote || !config.path) {
    throw new Error("Refusing to reset a remote database automatically.");
  }
  await assertResetTarget(config.path);
  for (const suffix of ["", "-wal", "-shm"]) {
    await rm(`${config.path}${suffix}`, { force: true });
  }
  const output = runDrizzle(config);
  await seedDatabase(config);
  return output;
}
