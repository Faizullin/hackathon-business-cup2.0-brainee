import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../schema";
import { type DatabaseConfig, getDatabaseConfig } from "./config";

// A factory keeps imports side-effect free. Runtime callers own the connection lifetime.
export async function openDatabase(config: DatabaseConfig = getDatabaseConfig()) {
  if (config.path) {
    await mkdir(dirname(config.path), { recursive: true });
  }
  // Keep every operation on the handle configured below (FKs, timeout, WAL).
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
    concurrency: 1,
  });
  try {
    if (!config.isRemote) {
      await client.execute("PRAGMA foreign_keys = ON");
      await client.execute("PRAGMA busy_timeout = 5000");
      await client.execute("PRAGMA journal_mode = WAL");
    }
    return { client, db: drizzle(client, { schema }) };
  } catch (error) {
    client.close();
    throw error;
  }
}

export type Database = Awaited<ReturnType<typeof openDatabase>>["db"];
