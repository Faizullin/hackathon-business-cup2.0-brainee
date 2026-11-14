import { expect, test } from "@playwright/test";

test("child tabs navigate, keep the bar, and show the dock except on the Brainy tab", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/learn");

  const tabs = page.getByRole("navigation", { name: "Sections" });
  const dock = page.getByTestId("brainy-dock");
  await expect(tabs.getByRole("link", { name: "Learn" })).toHaveAttribute("aria-current", "page");
  await expect(dock).toBeVisible();
  await expect(page.getByTestId("wallet-stars")).toContainText(/\d+/);
  const tabBox = await tabs.getByRole("link", { name: "Leisure" }).boundingBox();
  expect(tabBox?.height).toBeGreaterThanOrEqual(56);

  for (const [name, path, heading] of [
    ["Leisure", "/leisure", "Leisure"],
    ["Gifts", "/gifts", "Gifts"],
  ] as const) {
    await tabs.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(dock).toBeVisible();
  }

  await tabs.getByRole("link", { name: "Brainy" }).click();
  await expect(page).toHaveURL(/\/brainy$/);
  await expect(page.getByRole("heading", { level: 1, name: "My Brainy" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Brainy" })).toBeVisible();
  await expect(dock).toHaveCount(0);

  // The dock's Brainy opens the Brainy tab.
  await page.goto("/gifts");
  await page.getByRole("link", { name: "Open Brainy" }).click();
  await expect(page).toHaveURL(/\/brainy$/);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test("a game opens fullscreen from Learn and exits back", async ({ page }) => {
  await page.goto("/learn");
  await page.getByRole("link", { name: "ages 4+ Odd One Out Attention", exact: true }).click();
  await expect(page).toHaveURL(/\/game\/odd-one-out$/);
  await expect(page.getByRole("navigation", { name: "Sections" })).toHaveCount(0);
  await expect(page.getByTestId("brainy-dock")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Shape \d+$/ })).toHaveCount(9);
  await page.getByRole("button", { name: "Exit" }).click();
  await expect(page).toHaveURL(/\/learn$/);
});

test("unknown games show the not-found screen and cannot launch", async ({ page }) => {
  // Next streams the root loading boundary before this dynamic route resolves.
  await page.goto("/game/not-a-game");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", "noindex");
  await expect(page.getByTestId("embedded-game")).toHaveCount(0);
});
