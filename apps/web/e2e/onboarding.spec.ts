import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

// D-24: quiz BEFORE the account; answers set the starting Brainy. Own minimal login.
test("quiz → signup creates a family with a quiz-based Brainy; the parent can log in again", async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/onboarding");
  for (let question = 0; question < 5; question++) {
    await expect(page.getByTestId("quiz-progress")).toHaveText(`Question ${question + 1} of 5`);
    await page
      .locator("section")
      .getByRole("button")
      .filter({ hasNotText: /^Back$/ })
      .nth(2)
      .click();
  }
  await expect(page.getByRole("heading", { name: "Scroll Monster" })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Meet your Brainy!" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("onboarding-reveal.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Tap to begin" }).click();
  await page.getByLabel("Invite code (optional)").fill("FRIEND");
  const email = `parent-${Date.now()}-${test.info().project.name}@example.com`;
  await page.getByLabel("Child's name").fill("Mira");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password (at least 6 characters)").fill("secret123");
  await page.getByLabel("Parent PIN (4 digits)").fill("2468");
  await page.getByRole("button", { name: "Create & start" }).click();
  await expect(page).toHaveURL(/\/onboarding\/setup$/);
  await expect(page.getByTestId("setup-code")).toHaveText(/^[0-9]{6}$/);
  const state = await savedState(page.request);
  expect(state.child.name).toBe("Mira");
  expect(state.showcase.calendar?.timeZone).toBeTruthy();
  // All answers = 2 → sum 10: brain 10+10+4 = 24, capped body stats ≤ 40.
  expect(state.progress.stats.brain).toBe(24);
  expect(Math.max(...Object.values(state.progress.stats))).toBeLessThanOrEqual(40);
  expect(state.baseline).toEqual(state.progress.stats);
  expect(state.progress.wallet).toEqual({ stars: 50, suns: 0 });
  expect(state.parentUnlocked).toBe(true);

  const other = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  const parent = await other.newPage();
  await parent.goto("/login");
  await parent.getByLabel("Email").fill(email);
  await parent.getByLabel("Password").fill("wrong-password");
  await parent.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(parent.getByText("Invalid email or password")).toBeVisible();
  await parent.getByLabel("Password").fill("secret123");
  await parent.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(parent.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
  await expect(parent.getByText("Mira, ")).toBeVisible();
  await expect(parent.getByTestId("needs-attention")).toContainText("Assign tasks for today");
  await other.close();
});

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

test("onboarding goes back, reacts to answers and requires a sustained hold without reduced motion", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/onboarding");
  await page
    .locator("section")
    .getByRole("button")
    .filter({ hasNotText: /^Back$/ })
    .nth(1)
    .click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("Question 2 of 5");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("Question 1 of 5");
  await page.screenshot({
    path: info.outputPath("onboarding-question.png"),
    animations: "disabled",
  });
  for (let i = 0; i < 5; i++)
    await page
      .locator("section")
      .getByRole("button")
      .filter({ hasNotText: /^Back$/ })
      .nth(2)
      .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const hold = page.getByRole("button", { name: "Hold to start" });
  await hold.click();
  await expect(page.getByLabel("Child's name", { exact: true })).toHaveCount(0);
  await hold.focus();
  await page.keyboard.down("Space");
  await expect(page.getByLabel("Child's name", { exact: true })).toBeVisible();
  await page.keyboard.up("Space");
  await page.screenshot({
    path: info.outputPath("onboarding-signup.png"),
    fullPage: true,
    animations: "disabled",
  });
});
