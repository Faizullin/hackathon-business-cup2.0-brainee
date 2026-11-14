import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "@playwright/test";

const port = Number(process.env.BRAINEE_E2E_PORT ?? 3100);
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
    baseURL: `http://127.0.0.1:${port}`,
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
    command: `pnpm --filter @brainee/db db:reset && pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/learn`,
    reuseExistingServer: false,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      BRAINEE_LAB: "1",
      DEMO_MODE: "1",
      // Specs assert the Russian UI; a cookie header would override the session cookie jar.
      BRAINEE_DEFAULT_LOCALE: "ru",
      DATABASE_URL: pathToFileURL(databasePath).href,
    },
  },
});
