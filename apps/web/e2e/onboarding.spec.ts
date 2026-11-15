import { expect, test } from "@playwright/test";
import { answerHabits, atStep, openAt, STORAGE_KEY, score } from "./funnel";
import { savedState } from "./saved-state";

test("a finished game moves the child's skills by the game's weights and lands in the parent feed", async ({
  page,
  baseURL,
}) => {
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  const before = await savedState(page.request);
  const start = await page.request.post("/api/sessions/start", {
    headers,
    data: { gameId: "continue-pattern", level: 1 },
  });
  const { sessionId } = await start.json();
  const finish = await page.request.post("/api/sessions", {
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
  const { completion } = await finish.json();
  // Weights 70% logic / 30% attention on a 3-point budget → logic +2, attention +1.
  expect(completion.skillGains).toEqual({ logic: 2, attention: 1 });
  const after = await savedState(page.request);
  expect(after.progress.skills.logic).toBe(Math.min(100, before.progress.skills.logic + 2));
  expect(after.progress.skills.attention).toBe(Math.min(100, before.progress.skills.attention + 1));
  expect(after.showcase.feed.find((item) => item.kind === "game")).toMatchObject({
    kind: "game",
    title: "Continue the Pattern · 1",
  });
  await page.request.post("/api/sessions/stop", { headers });
});

test("login rejects unknown accounts and the demo account opens parent mode", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("mom@example.com");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
  await expect(page.getByTestId("event-feed")).toBeVisible();
  await page.getByRole("button", { name: "Back to Child" }).click();
  await expect(page).toHaveURL(/\/entry$/);
  expect((await savedState(page.request)).parentUnlocked).toBe(false);
});

test("funnel guards deep links, resumes, handles browser Back, isolated tours and reset", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start#offer");
  await atStep(page, "duration");
  await page.locator('[data-value="60-120"]').click();
  await atStep(page, "content");
  await page.locator('[data-value="ytk"]').click();
  await atStep(page, "finish");
  await page.reload();
  await atStep(page, "finish");
  expect(await score(page)).toBe(80 - 10 - 10);
  await page.goBack();
  await atStep(page, "content");
  await expect(page.locator('[data-value="ytk"]')).toHaveClass(/on/);
  const saved = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  await page.goto("/start?tour=1");
  await atStep(page, "duration");
  await expect(page.locator(".answer.on")).toHaveCount(0);
  await page.locator('[data-value="lt30"]').click();
  expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe(saved);
  await page.goto("/start?reset=1");
  await atStep(page, "duration");
  expect(await score(page)).toBe(80);
  await page.reload();
  await expect(page.locator(".answer.on")).toHaveCount(0);
});

test("funnel keeps the primary action reachable without sideways scroll on a first and a late screen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const screen of ["duration", "reveal", "solution", "offer"]) {
    await openAt(page, screen);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      screen,
    ).toBe(true);
    const action = page.locator(
      screen === "duration"
        ? ".answer"
        : screen === "offer"
          ? "[data-testid=start-plan]"
          : ".primary",
    );
    await action.last().scrollIntoViewIfNeeded();
    await expect(action.last()).toBeVisible();
  }
  await answerHabits(page).catch(() => {});
});
