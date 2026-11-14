import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "@playwright/test";

const port = Number(process.env.BRAINEE_E2E_PORT ?? 3100);
const databasePath = join(tmpdir(), `brainee-e2e-${randomUUID()}.db`);

const GAME_SPECS =
  /(games-integration|picture-puzzle|tangram|reflection|rhythm-copycat|secret-message-copy|magnet-explorer|neighborhood-map-walk|pattern|film)[\w-]*\.spec\.ts$/;
const LAYOUT_SPECS =
  /(child-shell|pwa-layout|mvp-pages|scaffold|onboarding|parent-patterns|funnel-moments)\.spec\.ts$/;

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
  // Tiered matrix (T-139): the demo device runs everything; other projects cover what differs.
  projects: [
    // Demo device: every spec, including all game, touch and film checks.
    { name: "webkit-ipad", use: { browserName: "webkit", viewport: { width: 1180, height: 820 } } },
    // Second engine: product flows, API and language checks; games are covered on WebKit iPad.
    {
      name: "chromium-phone",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
      testIgnore: GAME_SPECS,
    },
    // Remaining sizes: responsive layout only.
    {
      name: "chromium-ipad",
      use: { browserName: "chromium", viewport: { width: 1180, height: 820 } },
      testMatch: LAYOUT_SPECS,
    },
    {
      name: "webkit-phone",
      use: { browserName: "webkit", viewport: { width: 390, height: 844 } },
      testMatch: LAYOUT_SPECS,
    },
  ],
  webServer: {
    command: `pnpm --filter @brainee/db db:reset && pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/learn`,
    reuseExistingServer: false,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      BRAINEE_LAB: "1",
      DEMO_MODE: "1",
      DATABASE_URL: pathToFileURL(databasePath).href,
    },
  },
});
