import { parentWalletBreakdown } from "@brainee/core";
import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

test("parent Today, Week, family feed and wallet breakdown use saved activity", async ({
  page,
  baseURL,
}, info) => {
  const headers = { origin: baseURL as string };
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.request.post("/api/demo-session", { headers });
  expect((await page.request.post("/api/parent", { headers, data: { pin: "1234" } })).ok()).toBe(
    true,
  );
  const before = await savedState(page.request);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/analytics");
  await expect(page.getByTestId("parent-energy")).toHaveCSS("background-color", "rgb(28, 27, 51)");
  await expect(page.getByRole("meter", { name: "Energy scale" })).toHaveAttribute(
    "value",
    String(before.progress.mood),
  );
  await expect(page.getByTestId("parent-sessions")).toContainText(
    `${before.activity?.todaySessions.length ?? 0} completed`,
  );
  const week = page.getByTestId("parent-week");
  await expect(week.getByRole("button")).toHaveCount(7);
  await week.getByRole("button", { name: "Tue", exact: true }).click();
  await expect(week.getByRole("button", { name: "Tue", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("parent-day-detail")).toContainText("Tue");
  await expect(week).toContainText("Went well");
  await expect(week).toContainText("To work on");
  const later = page.getByTestId("needs-attention").getByRole("button", { name: "Later" });
  const count = await later.count();
  if (count > 0) {
    await later.first().click();
    await expect(later).toHaveCount(count - 1);
    expect((await savedState(page.request)).showcase.tasks).toEqual(before.showcase.tasks);
  }
  const filters = page.getByRole("group", { name: "Filter family events" });
  await filters.getByRole("button", { name: "Learning", exact: true }).click();
  await expect(filters.getByRole("button", { name: "Learning", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (const source of await page.getByTestId("event-source").allTextContents())
    expect(["Learning session", "Science quiz", "In-app task"]).toContain(source);
  await filters.getByRole("button", { name: "All", exact: true }).click();
  if (before.showcase.feed.length > 0)
    await expect(page.getByTestId("event-source").first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("parent-today-week.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/rewards");
  const state = await savedState(page.request);
  const breakdown = parentWalletBreakdown(state.progress.wallet, state.showcase);
  for (const currency of ["stars", "suns"] as const) {
    const card = page.getByTestId(`breakdown-${currency}`);
    await expect(card).toContainText(String(breakdown[currency].balance));
    await expect(card).toContainText("Base and other activity");
    await expect(card).toContainText(`+${breakdown[currency].earned}`);
    await expect(card).toContainText(`−${breakdown[currency].spent}`);
  }
  await page.screenshot({
    path: info.outputPath("parent-rewards-breakdown.png"),
    fullPage: true,
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
