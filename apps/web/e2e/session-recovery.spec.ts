import { expect, test } from "@playwright/test";
import { answerOddOneOut } from "./play-game";
import { readyState, savedState } from "./saved-state";

test("a lost finish response survives reload, reuses the issued ID and never replaces a newer balance", async ({
  page,
  playwright,
  baseURL,
}, testInfo) => {
  let loseResponse = true;
  const ids: string[] = [];
  let starts = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/sessions/start") starts++;
  });
  await page.route("**/api/sessions", async (route) => {
    ids.push(route.request().postDataJSON().sessionId);
    if (loseResponse) {
      loseResponse = false;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.goto("/game/odd-one-out?level=1&seed=42");
  const before = await readyState(page);
  await answerOddOneOut(page);
  await expect(page.getByRole("button", { name: "Save again" })).toBeVisible();
  await expect(page.getByTestId("earned-stars")).toHaveCount(0);
  expect((await savedState(page.request)).progress.wallet.stars).toBe(
    before.progress.wallet.stars + 12,
  );
  await page.screenshot({ path: testInfo.outputPath("save-retry.png"), fullPage: true });
  const other = await playwright.request.newContext({ baseURL });
  try {
    const headers = { origin: baseURL as string };
    await other.post("/api/demo-session", { headers });
    const start = await other.post("/api/sessions/start", {
      headers,
      data: { gameId: "continue-pattern", level: 1 },
    });
    await other.post("/api/sessions", {
      headers,
      data: {
        sessionId: (await start.json()).sessionId,
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
    await page.reload();
    await expect(page.getByTestId("earned-stars")).toContainText("+12");
    await expect(
      page.getByText(`You now have ${before.progress.wallet.stars + 24} ★`),
    ).toBeVisible();
    expect(starts).toBe(1);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(1);
    const after = await savedState(page.request);
    expect(after.version).toBe(before.version + 2);
    expect(after.progress.wallet.stars).toBe(before.progress.wallet.stars + 24);
    expect(
      await page.evaluate(() => sessionStorage.getItem("brainee-pending-finish-v1")),
    ).toBeNull();
  } finally {
    await other.dispose();
  }
});

test("blocked tab storage still permits an in-memory retry without optimistic rewards", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Unavailable", "SecurityError");
      },
    }),
  );
  let reject = true;
  const ids: string[] = [];
  await page.route("**/api/sessions", async (route) => {
    ids.push(route.request().postDataJSON().sessionId);
    if (reject) {
      reject = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"unavailable"}',
      });
    } else await route.continue();
  });
  await page.goto("/game/odd-one-out?seed=9");
  const before = await readyState(page);
  await answerOddOneOut(page);
  await expect(page.getByRole("button", { name: "Save again" })).toBeVisible();
  expect((await savedState(page.request)).version).toBe(before.version);
  await expect(page.getByTestId("earned-stars")).toHaveCount(0);
  await page.getByRole("button", { name: "Save again" }).click();
  await expect(page.getByTestId("earned-stars")).toContainText("+12");
  expect(new Set(ids).size).toBe(1);
  const after = await savedState(page.request);
  expect(after.version).toBe(before.version + 1);
  expect(after.progress.wallet.stars).toBe(before.progress.wallet.stars + 12);
});

test("a failed state refresh after a committed finish retains the result for safe replay", async ({
  page,
}) => {
  await page.goto("/game/odd-one-out?seed=11");
  const before = await readyState(page);
  const ids: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/sessions")
      ids.push(request.postDataJSON().sessionId);
  });
  await page.route("**/api/state*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"unavailable"}',
    }),
  );
  await answerOddOneOut(page);
  await expect(page.getByRole("button", { name: "Save again" })).toBeVisible();
  expect((await savedState(page.request)).progress.wallet.stars).toBe(
    before.progress.wallet.stars + 12,
  );
  await page.unroute("**/api/state*");
  await page.getByRole("button", { name: "Save again" }).click();
  await expect(page.getByTestId("earned-stars")).toContainText("+12");
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(1);
  expect((await savedState(page.request)).version).toBe(before.version + 1);
});
