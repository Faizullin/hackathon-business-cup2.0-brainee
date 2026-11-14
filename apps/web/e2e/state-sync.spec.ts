import { expect, test } from "@playwright/test";
import { readyState, savedState } from "./saved-state";

test("state is cookie-authorized, versioned and refreshed after a finish or stop", async ({
  request,
  baseURL,
}) => {
  expect((await request.get("/api/state")).status()).toBe(401);
  const headers = { origin: baseURL as string };
  await request.post("/api/demo-session", { headers });
  const before = await savedState(request);
  const unchanged = await request.get(`/api/state?since=${before.version}`);
  expect(unchanged.headers()["cache-control"]).toBe("no-store");
  expect(await unchanged.json()).toEqual({ changed: false, version: before.version });
  for (const since of ["", "-1", "1.1", "NaN", "9007199254740992", "1e2"])
    expect((await request.get(`/api/state?since=${since}`)).status()).toBe(400);
  expect(JSON.stringify(before)).not.toMatch(/pinHash|email|tokenHash|scrypt/);
  const launch = await request.post("/api/sessions/start", {
    headers,
    data: { gameId: "continue-pattern", level: 1 },
  });
  const { sessionId } = await launch.json();
  const body = {
    sessionId,
    result: {
      gameId: "continue-pattern",
      level: 1,
      rounds: 4,
      mistakes: 1,
      corrections: 1,
      durationMs: 0,
    },
  };
  expect((await request.post("/api/sessions", { headers, data: body })).status()).toBe(200);
  const after = await savedState(request);
  expect(after).toMatchObject({
    latestGame: { id: sessionId, title: "Continue the Pattern" },
    progress: { wallet: { stars: before.progress.wallet.stars + 13 }, streak: { inRow: 1 } },
  });
  // A newly earned reward may add a version during the first snapshot read.
  expect(after.version).toBeGreaterThan(before.version);
  expect(after.progress.stats.brain).toBe(Math.min(100, before.progress.stats.brain + 2));
  await request.post("/api/sessions/stop", { headers });
  const stopped = await request.get(`/api/state?since=${after.version}`);
  expect(await stopped.json()).toMatchObject({
    changed: true,
    snapshot: { version: after.version + 1, progress: { streak: { inRow: 0 } } },
  });
  await request.post("/api/sessions", { headers, data: body });
  expect((await savedState(request)).version).toBe(after.version + 1);
});

test("another device sees saved wallet and Brainy changes through polling without reloading", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const observerContext = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  try {
    await page.goto("/brainy");
    const before = await readyState(page);
    const observer = await observerContext.newPage();
    await observer.goto(`${baseURL}/learn`);
    await expect(observer.getByTestId("wallet-stars")).toContainText(
      String(before.progress.wallet.stars),
    );
    const unchanged = observer.waitForResponse((response) =>
      response.url().includes("/api/state?since="),
    );
    expect(await (await unchanged).json()).toMatchObject({ changed: false });
    const headers = { origin: baseURL as string };
    const start = await page.request.post("/api/sessions/start", {
      headers,
      data: { gameId: "continue-pattern", level: 1 },
    });
    const { sessionId } = await start.json();
    await page.request.post("/api/sessions", {
      headers,
      data: {
        sessionId,
        result: {
          gameId: "continue-pattern",
          level: 1,
          rounds: 4,
          mistakes: 0,
          corrections: 0,
          durationMs: 0,
        },
      },
    });
    await expect(observer.getByTestId("wallet-stars")).toContainText(
      String(before.progress.wallet.stars + 12),
      { timeout: 10_000 },
    );
    await expect(page.getByTestId("brainy-stat-brain")).toHaveText(
      String(Math.min(100, before.progress.stats.brain + 2)),
      { timeout: 10_000 },
    );
    expect((await savedState(observer.request)).progress.streak.inRow).toBe(0);
    expect((await savedState(page.request)).progress.streak.inRow).toBe(1);
    await observer.screenshot({ path: testInfo.outputPath("synced-learn.png"), fullPage: true });
    await observer.reload();
    await expect(observer.getByTestId("wallet-stars")).toContainText(
      String(before.progress.wallet.stars + 12),
    );
    expect(await observer.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    await observerContext.close();
  }
});

test("failed initial reads show no fake wallet; keyboard retry loads saved state and ignores old previews", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "brainee-learning-preview-v1",
      JSON.stringify({ progress: { wallet: { stars: 999999 } } }),
    ),
  );
  await page.route("**/api/state*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"unavailable"}',
    }),
  );
  await page.goto("/learn");
  await expect(page.getByRole("alert").filter({ hasText: "Could not load Brainy" })).toHaveText(
    "Could not load Brainy. Please try again.",
  );
  await expect(page.getByTestId("wallet-stars")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("state-error.png"), fullPage: true });
  await page.unroute("**/api/state*");
  // Keyboard coverage stays independent of the host's WebKit mouse-coordinate issue.
  await page.getByRole("button", { name: "Try again" }).focus();
  await page.keyboard.press("Enter");
  const actual = await readyState(page);
  await expect(page.getByTestId("wallet-stars")).toContainText(
    String(actual.progress.wallet.stars),
  );
  expect(
    await page.evaluate(() => sessionStorage.getItem("brainee-learning-preview-v1")),
  ).toBeNull();
});

test("a background read failure preserves confirmed state and recovers", async ({ page }) => {
  await page.goto("/learn");
  const before = await readyState(page);
  await page.route("**/api/state*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"unavailable"}',
    }),
  );
  await expect(
    page.getByRole("alert").filter({ hasText: "Could not update progress yet" }),
  ).toContainText("Could not update progress yet", {
    timeout: 10_000,
  });
  await expect(page.getByTestId("wallet-stars")).toContainText(
    String(before.progress.wallet.stars),
  );
  await expect(page.getByRole("heading", { name: "Learn", exact: true })).toBeVisible();
  await page.unroute("**/api/state*");
  await page.getByRole("button", { name: "Try again" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("alert").filter({ hasText: "Could not update progress yet" }),
  ).toHaveCount(0);
});

test("expired access asks for a reload without silently replacing an issued session", async ({
  page,
}, testInfo) => {
  let accessRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/demo-session") accessRequests++;
  });
  await page.goto("/learn");
  await readyState(page);
  await page.route("**/api/state*", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"error":"unauthorized"}',
    }),
  );
  await expect(page.getByText("Reopen the session to refresh Brainy.")).toBeVisible({
    timeout: 10_000,
  });
  expect(accessRequests).toBe(1);
  await page.unroute("**/api/state*");
  await page.getByRole("button", { name: "Reopen" }).focus();
  await page.keyboard.press("Enter");
  await readyState(page);
  expect(accessRequests).toBe(2);

  await page.route("**/api/sessions/start", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"error":"unauthorized"}',
    }),
  );
  await page.getByRole("link", { name: "ages 4+ Odd One Out Attention", exact: true }).click();
  await expect(page.getByText("Reopen the session to refresh Brainy.")).toBeVisible();
  await expect(page.locator("[data-game]")).toHaveCount(0);
  expect(accessRequests).toBe(2);
  await page.screenshot({ path: testInfo.outputPath("expired-launch.png"), fullPage: true });
  await page.unroute("**/api/sessions/start");
  await page.getByRole("button", { name: "Reopen" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-game="odd-one-out"]')).toBeVisible();
  expect(accessRequests).toBe(3);
});
