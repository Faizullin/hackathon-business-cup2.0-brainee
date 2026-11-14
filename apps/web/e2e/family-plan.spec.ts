import { planFor } from "@brainee/core";
import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

test("saved family plan edits, downloads and supplies a parent-approved off-screen task and stopping phrase", async ({
  page,
  baseURL,
}, info) => {
  const headers = { origin: baseURL as string };
  await page
    .context()
    .addCookies([{ name: "brainee_locale", value: "en", url: baseURL as string }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const funnel = {
    goal: "ending",
    age: "6-7",
    duration: "one",
    content: "kids",
    finish: "switch",
    handoff: "bargain",
    reading: "together",
    attempt: "timer",
    moment: "afternoon",
  };
  const created = await page.request.post("/api/onboarding", {
    headers,
    data: {
      email: `plan-${Date.now()}-${info.project.name}@example.com`,
      password: "secret123",
      pin: "1234",
      childName: "Alex",
      birthYear: new Date().getUTCFullYear() - 6,
      funnel,
    },
  });
  expect(created.status()).toBe(201);
  expect((await savedState(page.request)).showcase.familyPlan).toEqual(funnel);
  await page.goto("/analytics");
  const card = page.getByTestId("family-plan");
  await expect(card).toContainText(planFor(funnel)?.cue ?? "");
  await card.getByRole("button", { name: "Edit answers" }).click();
  await card.getByText("See or change my answers").click();
  await card.getByRole("button", { name: /Change: What do they usually/ }).click();
  await card.getByRole("radio", { name: "Games and puzzles" }).click();
  await card.getByRole("button", { name: "Save family plan" }).click();
  await expect(card.getByRole("status")).toHaveText("Family plan saved");
  const changed = { ...funnel, content: "games" };
  expect((await savedState(page.request)).showcase.familyPlan).toEqual(changed);
  const download = page.waitForEvent("download");
  await card.getByRole("link", { name: "Download plan" }).click();
  expect((await download).suggestedFilename()).toBe("brainy-family-plan.txt");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("family-plan.png"), fullPage: true });
  await page.goto("/tasks");
  await page.getByRole("button", { name: "Use this task · 1 ☀" }).click();
  expect((await savedState(page.request)).showcase.tasks).toHaveLength(0);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("task-limit")).toContainText("1 of 5");
  const before = await savedState(page.request);
  expect(before.progress.wallet.suns).toBe(0);
  expect(before.showcase.tasks[0]).toMatchObject({ place: "real", reward: 1, status: "todo" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("family-task.png"), fullPage: true });
  await page.request.delete("/api/parent", { headers });
  expect(
    (
      await page.request.post("/api/actions", {
        headers,
        data: { type: "family-plan", answers: funnel },
      })
    ).status(),
  ).toBe(401);
  await page.goto("/game/odd-one-out?level=1&seed=42");
  for (let n = 0; n < 3; n++) {
    for (let round = 0; round < 4; round++) {
      const cells = page.getByRole("button", { name: /^Shape \d+$/ });
      await expect(cells.first()).toBeVisible();
      const shapes = await cells
        .locator("svg")
        .evaluateAll((elements) => elements.map((element) => element.innerHTML));
      const odd = shapes.findIndex(
        (shape) => shapes.filter((other) => other === shape).length === 1,
      );
      expect(odd).toBeGreaterThanOrEqual(0);
      await cells.nth(odd).click();
      await page.getByRole("button", { name: /^(Next|Done)$/ }).click();
    }
    await expect(page.getByTestId("post-game")).toBeVisible();
    await expect(page.getByTestId("stopping-phrase").first()).toContainText(
      planFor(changed)?.cue ?? "",
    );
    if (n < 2) await page.getByTestId("next-level").click();
  }
  await expect(page.getByTestId("break-suggestion").getByTestId("stopping-phrase")).toContainText(
    planFor(changed)?.cue ?? "",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("family-stopping.png"), fullPage: true });
});
