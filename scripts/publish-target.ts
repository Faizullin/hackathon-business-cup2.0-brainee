import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseEnv } from "node:util";
import { openDatabase } from "../packages/db/src/client";
import { getDatabaseConfig } from "../packages/db/src/config";
import { syncRemoteGames } from "../packages/db/src/remote-games";
import {
  r2ObjectKey,
  type StorageDriver,
  storageDriver,
} from "../packages/game-catalog/src/storage";
import { publish } from "./publish-remote";

export function parseOptions(args: string[]) {
  const [input, ...rest] = args;
  if (!input || input.startsWith("--"))
    throw new Error(
      "Usage: games:publish <folder|zip|id> [--target local|deployed] [--dry-run] [--yes]",
    );
  const options = {
    input,
    target: "local",
    dryRun: false,
    yes: false,
    disable: false,
    enable: false,
    version: undefined as string | undefined,
    rollback: undefined as string | undefined,
    r2Env: undefined as string | undefined,
    dbEnv: undefined as string | undefined,
  };
  while (rest.length) {
    const flag = rest.shift();
    if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--yes") options.yes = true;
    else if (flag === "--disable") options.disable = true;
    else if (flag === "--enable") options.enable = true;
    else {
      const value = rest.shift();
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
      if (flag === "--target") options.target = value;
      else if (flag === "--version") options.version = value;
      else if (flag === "--rollback") options.rollback = value;
      else if (flag === "--r2-env") options.r2Env = value;
      else if (flag === "--db-env") options.dbEnv = value;
      else if (flag === "--driver" && value === "fs") options.target = "local";
      else throw new Error(`Unsupported option ${flag}; use --target deployed for R2`);
    }
  }
  if (!["local", "deployed"].includes(options.target))
    throw new Error("Target must be local or deployed");
  if ([options.disable, options.enable, options.rollback].filter(Boolean).length > 1)
    throw new Error("Choose one catalog action");
  if (options.target === "deployed" && !options.yes)
    throw new Error("--target deployed requires --yes (including dry-run)");
  return options;
}
export type PublishOptions = ReturnType<typeof parseOptions>;
export async function targetEnvironment(options: PublishOptions, cwd = process.cwd()) {
  const common = execFileSync("git", ["rev-parse", "--git-common-dir"], {
    cwd,
    encoding: "utf8",
  }).trim();
  const main = dirname(resolve(cwd, common));
  const env: NodeJS.ProcessEnv = { ...process.env };
  async function load(file: string, names: string[], required: boolean) {
    try {
      const parsed = parseEnv(await readFile(file, "utf8"));
      for (const name of names) if (parsed[name] !== undefined) env[name] = parsed[name];
    } catch (error) {
      if (!required && (error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw new Error("Could not read target env file; check --r2-env/--db-env paths");
    }
  }
  if (options.target === "deployed") {
    // Credentials must come from the selected files, never a stale invoking shell.
    for (const key of [
      "R2_BUCKET",
      "R2_BUCKET_NAME",
      "R2_ENDPOINT",
      "R2_ENDPOINT_URL",
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "DATABASE_URL",
      "DATABASE_AUTH_TOKEN",
    ])
      delete env[key];
    await load(
      options.r2Env ?? resolve(main, ".local/secrets.env.r2"),
      [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "R2_BUCKET_NAME",
        "R2_ENDPOINT",
        "R2_ENDPOINT_URL",
      ],
      true,
    );
    await load(
      options.dbEnv ?? resolve(main, ".env.deployed"),
      ["DATABASE_URL", "DATABASE_AUTH_TOKEN"],
      true,
    );
    if (!env.DATABASE_URL) throw new Error("Deployed target needs DATABASE_URL");
  } else {
    // Local publishing must never inherit a cloud DB from the invoking shell.
    env.DATABASE_URL = "file:./data/dev.db";
    delete env.DATABASE_AUTH_TOKEN;
    await load(
      options.dbEnv ?? resolve(cwd, "apps/web/.env.local"),
      ["DATABASE_URL"],
      Boolean(options.dbEnv),
    );
    if (!env.DATABASE_URL?.startsWith("file:"))
      throw new Error("Local target requires a file DATABASE_URL");
  }
  return env;
}
/** Injection is used only by tests: deployed orchestration against fs + a disposable libSQL file. */
export async function publishTarget(
  options: PublishOptions,
  env: NodeJS.ProcessEnv,
  injected?: StorageDriver,
  log: (line: string) => void = console.log,
) {
  if (options.target === "deployed" && !options.yes)
    throw new Error("Deployed target requires --yes");
  const config = getDatabaseConfig(env.DATABASE_URL, process.cwd(), env.DATABASE_AUTH_TOKEN);
  if (options.target === "local" && config.isRemote)
    throw new Error("Local target requires a local database");
  const driver = injected ?? storageDriver(options.target === "deployed" ? "r2" : "fs", env);
  let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
  try {
    if (!options.dryRun) {
      try {
        connection = await openDatabase(config);
        await connection.client.execute("SELECT id FROM games LIMIT 0");
      } catch {
        throw new Error(
          "Cannot access games table; prepare the target DB before publishing (no schema or seed changes were made)",
        );
      }
    }
    const result = await publish(options.input, options, driver);
    for (const key of result.keys)
      log(
        `${options.dryRun ? "PLAN" : "SAVED"} ${options.target === "deployed" ? "R2" : "fs"} ${options.target === "deployed" ? r2ObjectKey(key) : key}`,
      );
    const active = result.rows.find((row) => row.enabled);
    log(
      `${options.dryRun ? "PLAN" : "SYNC"} DB games id=${result.id} enabled=${Boolean(active?.manifest.scored)} (${active?.manifest.scored ? "upsert catalog columns" : "disable existing scored row only; Explore gets no row"})`,
    );
    if (connection) {
      try {
        await syncRemoteGames(connection.db, result.rows);
      } catch {
        throw new Error(
          "Catalog saved but DB synchronization failed; rerun the same command to repair it. No other tables were changed",
        );
      }
    }
    return result;
  } finally {
    connection?.client.close();
  }
}
export async function main(args: string[]) {
  const options = parseOptions(args);
  const env = await targetEnvironment(options);
  await publishTarget(options, env);
}
