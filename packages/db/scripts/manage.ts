import { existsSync } from "node:fs";
import { getDatabaseConfig } from "../src/config";
import { resetDatabase, runDrizzle, seedDatabase } from "./database-tools";

try {
  const command = process.argv[2];
  if (!["prepare", "push", "seed", "refresh-demo", "reset", "studio"].includes(command ?? "")) {
    throw new Error("Usage: manage.ts <prepare|push|seed|refresh-demo|reset|studio>");
  }
  const config = getDatabaseConfig();
  // First run on a fresh clone: create and seed a missing local file; never touch existing data.
  if (command === "prepare") {
    if (config.isRemote || !config.path || existsSync(config.path)) {
      console.log(`Database ready: ${config.path || "remote"}`);
      process.exit(0);
    }
    console.log((await resetDatabase(config)).trim());
  }
  if (command === "reset") console.log((await resetDatabase(config)).trim());
  if (command === "push") console.log(runDrizzle(config).trim());
  if (command === "seed") await seedDatabase(config);
  if (command === "refresh-demo") await seedDatabase(config, true);
  if (command === "studio") runDrizzle(config, "studio");
  console.log(`Database ${command} complete: ${config.path ?? config.url}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
