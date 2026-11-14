import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/config";

export default defineConfig({
  dialect: "sqlite",
  schema: "./schema.ts",
  dbCredentials: { url: getDatabaseConfig().url },
});
