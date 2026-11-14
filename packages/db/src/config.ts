import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function findWorkspaceRoot(cwd: string) {
  let directory = resolve(cwd);
  while (true) {
    if (existsSync(resolve(directory, "pnpm-workspace.yaml"))) return directory;
    const parent = dirname(directory);
    if (parent === directory)
      throw new Error("Cannot locate the pnpm workspace for a relative DATABASE_URL.");
    directory = parent;
  }
}

export function getDatabaseConfig(databaseUrl = process.env.DATABASE_URL, cwd = process.cwd()) {
  const url = databaseUrl ?? "file:./data/dev.db";
  if (!url.startsWith("file:") || url === "file:" || url === "file::memory:") {
    throw new Error("DATABASE_URL must point to a local SQLite file (file:...).");
  }

  let filePath: string;
  if (url.startsWith("file://")) {
    const parsed = new URL(url);
    if (parsed.search || parsed.hash)
      throw new Error("DATABASE_URL must not contain query parameters or fragments.");
    filePath = fileURLToPath(parsed);
  } else {
    const path = url.slice("file:".length);
    if (path.includes("?") || path.includes("#"))
      throw new Error("Use a file URL to encode special characters in a database path.");
    filePath = isAbsolute(path) ? resolve(path) : resolve(findWorkspaceRoot(cwd), path);
  }

  return { path: filePath, url: pathToFileURL(filePath).href };
}

export type DatabaseConfig = ReturnType<typeof getDatabaseConfig>;
