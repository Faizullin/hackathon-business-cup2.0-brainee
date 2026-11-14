import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: "list",
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
      use: { browserName: "chromium", viewport: { width: 820, height: 1180 } },
    },
    { name: "webkit-phone", use: { browserName: "webkit", viewport: { width: 390, height: 844 } } },
    { name: "webkit-ipad", use: { browserName: "webkit", viewport: { width: 820, height: 1180 } } },
  ],
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/learn",
    reuseExistingServer: false,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
