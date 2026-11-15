import { basename, dirname } from "node:path";
import { defineConfig } from "@playwright/test";

const ids = (process.env.GAME_TEST_IDS ?? "").split(",").filter(Boolean);
if (!process.env.GAME_TEST_URL || !ids.length)
  throw new Error("Run pnpm test:game <id> or pnpm test:games");
export default defineConfig({
  testDir: process.env.GAME_TEST_SPEC ? dirname(process.env.GAME_TEST_SPEC) : "../..",
  testMatch: process.env.GAME_TEST_SPEC
    ? basename(process.env.GAME_TEST_SPEC)
    : process.env.GAME_TEST_REMOTE === "1"
      ? "**/e2e-games/remote.spec.ts"
      : ids.map((id) => `**/games/${id}/game.spec.ts`),
  outputDir: "test-results/games",
  fullyParallel: true,
  workers: 4,
  timeout: 20000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/games/timings.json" }]],
  use: {
    baseURL: process.env.GAME_TEST_URL,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "webkit-ipad",
      workers: 1,
      use: { browserName: "webkit", viewport: { width: 1180, height: 820 } },
    },
    {
      name: "chromium-phone",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
  ],
});
