import { getDatabaseConfig } from "../src/config";
import { resetDatabase, runDrizzle, seedDatabase } from "./database-tools";

try {
  const command = process.argv[2];
  if (!["push", "seed", "refresh-demo", "reset", "studio"].includes(command ?? "")) {
    throw new Error("Usage: manage.ts <push|seed|refresh-demo|reset|studio>");
  }
  const config = getDatabaseConfig();
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
