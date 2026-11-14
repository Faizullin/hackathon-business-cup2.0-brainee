import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "@playwright/test";

const port = Number(process.env.BRAINEE_E2E_PORT ?? 3100);
const databasePath = join(tmpdir(), `brainee-e2e-${randomUUID()}.db`);

// Default `pnpm e2e` is a fast core run; `pnpm e2e:full` (E2E_FULL=1) restores every game and size.
const FULL = process.env.E2E_FULL === "1";
// Heavy, already-stable game checks (acceptance, stress, integration): full mode only.
const HEAVY_GAME_SPECS =
  /(games-integration|picture-puzzle|reflection|rhythm-copycat|secret-message-copy|magnet-explorer|neighborhood-map-walk)[\w-]*\.spec\.ts$/;
// Every game-related spec, for the projects that skip games entirely.
const GAME_SPECS =
  /(games-integration|picture-puzzle|tangram|reflection|rhythm-copycat|secret-message-copy|magnet-explorer|neighborhood-map-walk|pattern|film)[\w-]*\.spec\.ts$/;
const LAYOUT_SPECS =
  /(child-shell|pwa-layout|mvp-pages|scaffold|onboarding|parent-patterns|funnel-moments|post-game)\.spec\.ts$/;

const webkitIpad = { browserName: "webkit" as const, viewport: { width: 1180, height: 820 } };
const chromiumPhone = { browserName: "chromium" as const, viewport: { width: 390, height: 844 } };

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
  projects: FULL
    ? [
        // Full matrix: the demo device runs everything; other projects cover what differs.
        { name: "webkit-ipad", use: webkitIpad },
        { name: "chromium-phone", use: chromiumPhone, testIgnore: GAME_SPECS },
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
      ]
    : [
        // Core: product flows, API, language, films and one game per runtime (React + embedded).
        { name: "webkit-ipad", use: webkitIpad, testIgnore: HEAVY_GAME_SPECS },
        // Second engine at phone width: layout and the main flows only.
        { name: "chromium-phone", use: chromiumPhone, testMatch: LAYOUT_SPECS },
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
