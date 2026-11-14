import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "@playwright/test";

const databasePath = join(tmpdir(), `brainee-e2e-${randomUUID()}.db`);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // UI writes now share the seeded child; run in order and assert relative saved state.
  workers: 1,
  reporter: "list",
  metadata: { databasePath },
  globalTeardown: "./e2e/cleanup-database.ts",
  use: {
    baseURL: "http://127.0.0.1:3100",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-phone",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
    {
      name: "chromium-ipad",
      use: { browserName: "chromium", viewport: { width: 1180, height: 820 } },
    },
    { name: "webkit-phone", use: { browserName: "webkit", viewport: { width: 390, height: 844 } } },
    { name: "webkit-ipad", use: { browserName: "webkit", viewport: { width: 1180, height: 820 } } },
  ],
  webServer: {
    command:
      "pnpm --filter @brainee/db db:reset && pnpm exec next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/learn",
    reuseExistingServer: false,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      BRAINEE_LAB: "1",
      DEMO_MODE: "1",
      DATABASE_URL: pathToFileURL(databasePath).href,
    },
  },
});
