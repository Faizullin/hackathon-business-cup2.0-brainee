import { expect, test } from "@playwright/test";
import { finishOddOneOut } from "./play-game";
import { savedState } from "./saved-state";

// D-21 demo pages: every child/parent screen renders, key interactions persist and sync.
test.beforeEach(async ({ page, baseURL }) => {
  const headers = { origin: baseURL as string };
  expect((await page.request.post("/api/demo-session", { headers })).ok()).toBe(true);
  await page.request.post("/api/parent", { headers, data: { pin: "1234" } });
  expect((await page.request.post("/api/demo-reset", { headers })).ok()).toBe(true);
  await page.request.delete("/api/parent", { headers });
});

test("entry screen recommends games, has no close button, and logs the choice", async ({
  page,
}) => {
  await page.goto("/entry");
  await expect(page).toHaveURL(/\/entry$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "What are we playing now?" }),
  ).toBeVisible();
  await expect(page.getByText("Most important right now")).toBeVisible();
  expect(await page.getByTestId("recommended-game").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("button", { name: /close/i })).toHaveCount(0);
  const before = await savedState(page.request);
  await page.getByRole("link", { name: "No, I want to see other games" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Brainy recommends" })).toBeVisible();
  await expect
    .poll(async () => (await savedState(page.request)).showcase.entryLog.other)
    .toBe(before.showcase.entryLog.other + 1);
});

test("child: accessory shop, gifts, exchange and a task waiting for the parent", async ({
  page,
}) => {
  await page.goto("/brainy");
  const before = await savedState(page.request);
  await page.getByRole("button", { name: /Buy · 50★/ }).click();
  await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible();
  await expect
    .poll(async () => (await savedState(page.request)).progress.wallet.stars)
    .toBe(before.progress.wallet.stars - 50);

  await page.goto("/gifts");
  await expect(page.getByText(/Collect 10 suns and receive: Movie night out/)).toBeVisible();
  const task = page.getByTestId("child-task-t3");
  await task.getByRole("button", { name: "Done!" }).click();
  await expect(task).toContainText("Awaiting confirmation");
  await page.getByRole("button", { name: "1 ☀ for 10 ★" }).click();
  await expect
    .poll(async () => (await savedState(page.request)).progress.wallet.suns)
    .toBe(before.progress.wallet.suns - 1);
});

test("leisure sells Snake and Explore games for stars; free films are on Learn", async ({
  page,
}) => {
  await page.goto("/leisure");
  await expect(page.getByRole("heading", { name: "Games for stars" })).toBeVisible();
  await expect(page.getByTestId("fun-game-snake")).toBeVisible();
  await expect(page.getByTestId("fun-game-shape-pairs")).toContainText("10 min · 20★");
  await expect(page.getByText(/Rocket Runner|Rhythm Drums|Catapult|Maze Racers/)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Cartoons and stories" })).toHaveCount(0);
  await expect(page.locator('a[href^="/video/"]')).toHaveCount(0);
  await page.goto("/explore");
  await expect(page).toHaveURL(/\/leisure$/);
  await page.goto("/learn");
  const films = page.locator('a[href^="/video/"]');
  await expect(films).toHaveCount(3);
  for (const id of ["sky-blue", "rain", "sun-goes"])
    await expect(page.locator(`a[href="/video/${id}"]`)).toBeVisible();
  for (const path of ["/video/bees", "/cartoon/volcano"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  }
});

test("an Explore game bought for stars plays in its sandbox while time counts", async ({
  page,
}) => {
  const before = await savedState(page.request);
  await page.goto("/leisure");
  const card = page.getByTestId("fun-game-shape-pairs");
  await card.getByRole("button", { name: "10 min · 20★" }).click();
  await expect
    .poll(async () => (await savedState(page.request)).progress.wallet.stars)
    .toBe(before.progress.wallet.stars - 20);
  await card.getByRole("button", { name: "Play" }).click();
  await expect(page).toHaveURL(/\/fun\/shape-pairs$/);
  await expect(page.getByTestId("fun-time")).toContainText("10:00");
  await page.getByRole("button", { name: "Play" }).click();
  const frame = page.getByTestId("explore-frame");
  await expect(frame).toHaveAttribute("data-ready", "true", { timeout: 15000 });
  await expect(page.getByTestId("fun-time")).not.toContainText("10:00", { timeout: 5000 });
});

test("parent: PIN barrier, analytics, confirming a task and syncing to the child", async ({
  browser,
  page,
  baseURL,
}) => {
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { level: 1, name: "Parent login" })).toBeVisible();
  for (const digit of "0000") await page.getByRole("button", { name: `Digit ${digit}` }).click();
  await expect(page.getByText("Incorrect PIN. Please try again.")).toBeVisible();
  for (const digit of "1234") await page.getByRole("button", { name: `Digit ${digit}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Skills" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Character" })).toBeVisible();
  await page.getByRole("button", { name: "City" }).click();
  await expect(page.getByText(/of 4,820/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const ranking = (await savedState(page.request)).showcase.analytics.ranking;
  for (const scope of Object.values(ranking))
    for (const table of Object.values(scope))
      for (const row of table.rows) expect(row.name).toMatch(/^\p{L}+ \p{L}\.$/u);

  // A second device: the child's view updates through polling, without reloading.
  const childContext = await browser.newContext({
    baseURL,
    viewport: page.viewportSize(),
    colorScheme: "light",
  });
  const child = await childContext.newPage();
  await child.goto("/gifts");
  const childTask = child.getByTestId("child-task-t2");
  await expect(childTask).toContainText("Awaiting confirmation");
  const beforeTask = await savedState(child.request);
  const suns = beforeTask.progress.wallet.suns;

  await page
    .getByRole("navigation", { name: "Parent sections" })
    .last()
    .getByRole("link", { name: "Tasks" })
    .click();
  const parentTask = page.getByTestId("parent-task-t2");
  await parentTask.getByRole("button", { name: "Confirm" }).click();
  await expect(parentTask).toContainText("Completed");
  await expect(childTask).toContainText("Completed", { timeout: 10_000 });
  const afterTask = await savedState(child.request);
  expect(afterTask.progress.wallet.suns).toBe(suns + 2);
  expect(afterTask.showcase.weekGoal.earned).toBe(beforeTask.showcase.weekGoal.earned + 2);
  expect(afterTask.progress.stats.resp).toBe(beforeTask.progress.stats.resp + 2);

  await page
    .getByRole("navigation", { name: "Parent sections" })
    .last()
    .getByRole("link", { name: "Gifts & Goal" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Gifts & goal" })).toBeVisible();
  await childContext.close();
});

test("worn accessories follow Brainy to the dock and both post-game portraits", async ({
  page,
}) => {
  await page.goto("/brainy");
  await page.getByRole("button", { name: /Buy · 50★/ }).click();
  const item = page.locator("li").filter({ hasText: "Bowtie" });
  await item.getByRole("button", { name: "Remove", exact: true }).click();
  await item.getByRole("button", { name: "Wear", exact: true }).click();
  await expect(item.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
  const equipped = (await savedState(page.request)).showcase.equipped;
  const accessory = Object.values(equipped).find((id) => id !== "glasses");
  expect(accessory).toBeTruthy();
  await page.goto("/learn");
  await expect(page.getByTestId("brainy-dock").locator(`[data-acc="${accessory}"]`)).toBeVisible();
  await page.goto("/game/odd-one-out?seed=42");
  await finishOddOneOut(page);
  await expect(page.getByTestId("post-game").locator(`[data-acc="${accessory}"]`)).toHaveCount(2);
});

test("rankings never appear on child routes, even after parent access", async ({
  page,
  baseURL,
}) => {
  await page.request.post("/api/parent", {
    headers: { origin: baseURL as string },
    data: { pin: "1234" },
  });
  for (const path of [
    "/entry",
    "/learn",
    "/brainy",
    "/gifts",
    "/leisure",
    "/video/rain",
    "/game/odd-one-out",
    "/game/continue-pattern",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leaderboard", exact: true })).toHaveCount(0);
    await expect(page.getByText(/of 4,820|Leaderboard/)).toHaveCount(0);
  }
});
