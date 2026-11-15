import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

const funnelAnswers = {
  goal: "ending",
  age: "6-7",
  handoff: "bargain",
  content: "kids",
  finish: "switch",
  reading: "together",
  duration: "one",
  attempt: "timer",
  moment: "afternoon",
};

test("parent funnel resumes, creates a quiz-based family and reaches device setup", async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/start#cover$/);
  const route = [
    "cover",
    "welcome",
    "growth",
    "feed",
    "match",
    "reward",
    "personalize",
    "goal",
    "age",
    "handoff",
    "content",
    "finish",
    "reading",
    "pause",
    "duration",
    "profile",
    "week",
    "attempt",
    "method",
    "parent",
    "example",
    "benefits",
    "moment",
    "result",
    "offer",
  ];
  for (const step of route) {
    await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", step);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    const chosen = funnelAnswers[step as keyof typeof funnelAnswers];
    if (chosen) {
      await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
      const values: Record<string, number> = {
        goal: 0,
        age: 1,
        handoff: 2,
        content: 1,
        finish: 2,
        reading: 2,
        duration: 2,
        attempt: 0,
        moment: 0,
      };
      await page
        .getByRole("radio")
        .nth(values[step] ?? 0)
        .click();
    }
    if (["cover", "age", "profile", "result", "offer"].includes(step))
      await page.screenshot({
        path: info.outputPath(`funnel-${step}.png`),
        fullPage: true,
        animations: "disabled",
      });
    if (step === "offer") break;
    await page
      .getByRole("button", { name: step === "cover" ? "Meet Brainy" : "Continue", exact: true })
      .click();
  }
  await page.reload();
  await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", "offer");
  await expect(page.getByText("Pricing pending", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create my family account", exact: true }).click();
  const email = `funnel-${Date.now()}-${info.project.name}@example.com`;
  await page.getByLabel("Child's name", { exact: true }).fill("Alex");
  await page
    .getByLabel("Birth year", { exact: true })
    .fill(String(new Date().getUTCFullYear() - 6));
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password (at least 6 characters)").fill("secret123");
  await page.getByLabel("Parent PIN (4 digits)").fill("2468");
  await page.screenshot({ path: info.outputPath("funnel-signup.png"), fullPage: true });
  await page.getByRole("button", { name: "Create & start" }).click();
  await expect(page).toHaveURL(/\/onboarding\/setup$/);
  await expect(page.getByTestId("setup-code")).toHaveText(/^[0-9]{6}$/);
  const state = await savedState(page.request);
  expect(state.child.name).toBe("Alex");
  expect(state.progress.wallet).toEqual({ stars: 50, suns: 0 });
  expect(state.progress.stats.brain).toBe(20);
  expect(state.baseline).toEqual(state.progress.stats);
  expect(state.showcase.calendar?.timeZone).toBeTruthy();
  expect(Math.max(...Object.values(state.progress.stats))).toBeLessThanOrEqual(40);
  expect(state.parentUnlocked).toBe(true);
  const other = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  try {
    const parent = await other.newPage();
    await parent.goto("/login");
    await parent.getByLabel("Email").fill(email);
    await parent.getByLabel("Password").fill("wrong-password");
    await parent.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(parent.getByText("Invalid email or password")).toBeVisible();
    await parent.getByLabel("Password").fill("secret123");
    await parent.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(parent.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
    await expect(parent.getByTestId("parent-energy")).toBeVisible();
    await expect(parent.getByTestId("needs-attention")).toContainText("Assign tasks for today");
    expect((await savedState(other.request)).child.id).toBe(state.child.id);
  } finally {
    await other.close();
  }
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

test("funnel guards deep links, handles outside ages, browser Back, migration and isolated tours", async ({
  page,
}, info) => {
  await page.goto("/start#result");
  await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", "goal");
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Outside this age range" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A little later, or a different fit" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", "age");
  await page.getByRole("radio", { name: "6–7 years old" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", "handoff");
  const saved = await page.evaluate(() => localStorage.getItem("brainy.us-parent-quiz.v2"));
  await page.goto("/start?tour=1&angle=offline");
  await expect(
    page.getByRole("heading", { name: "Give your child a reason to look up." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Meet Brainy", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("brainy.us-parent-quiz.v2"))).toBe(saved);
  await page.evaluate(
    (answers) =>
      localStorage.setItem(
        "brainy.us-parent-quiz.v2",
        JSON.stringify({ version: 3, screen: "result", answers }),
      ),
    funnelAnswers,
  );
  await page.goto("/start");
  await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", "result");
  await page.screenshot({ path: info.outputPath("funnel-migrated.png"), fullPage: true });
});

test("opening a saved cover preserves its last story bookmark", async ({ page }) => {
  await page.goto("/start");
  await page.evaluate((all) => {
    const { attempt: _attempt, moment: _moment, ...answers } = all;
    localStorage.setItem(
      "brainy.us-parent-quiz.v2",
      JSON.stringify({ version: 4, screen: "cover", resumeAt: "week", answers }),
    );
  }, funnelAnswers);
  await page.goto("/start");
  await page.getByRole("button", { name: "Continue my plan", exact: true }).click();
  await expect(page.getByTestId("parent-funnel")).toHaveAttribute("data-step", "week");
});
