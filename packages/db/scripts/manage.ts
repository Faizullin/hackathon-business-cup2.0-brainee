import { getDatabaseConfig } from "../src/config";
import { resetDatabase, runDrizzle, seedDatabase } from "./database-tools";

try {
  const command = process.argv[2];
  if (!["push", "seed", "reset", "studio"].includes(command ?? "")) {
    throw new Error("Usage: manage.ts <push|seed|reset|studio>");
  }
  const config = getDatabaseConfig();
  if (command === "reset") console.log((await resetDatabase(config)).trim());
  if (command === "push") console.log(runDrizzle(config).trim());
  if (command === "seed") await seedDatabase(config);
  if (command === "studio") runDrizzle(config, "studio");
  console.log(`Database ${command} complete: ${config.path}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
