import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/config";

const config = getDatabaseConfig();

export default defineConfig({
  dialect: config.isRemote ? "turso" : "sqlite",
  schema: "./schema.ts",
  dbCredentials: {
    url: config.url,
    authToken: config.authToken,
  },
});
