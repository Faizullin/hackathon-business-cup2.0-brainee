import { expect, test } from "@playwright/test";

test("child tabs navigate, keep the bar, and show the dock except on the Brainy tab", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/learn");

  const tabs = page.getByRole("navigation", { name: "Разделы" });
  const dock = page.getByTestId("brainy-dock");
  await expect(tabs.getByRole("link", { name: "Учимся" })).toHaveAttribute("aria-current", "page");
  await expect(dock).toBeVisible();
  await expect(page.getByTestId("wallet-stars")).toContainText(/\d+/);
  const tabBox = await tabs.getByRole("link", { name: "Отдых" }).boundingBox();
  expect(tabBox?.height).toBeGreaterThanOrEqual(56);

  for (const [name, path, heading] of [
    ["Отдых", "/leisure", "Отдых"],
    ["Подарки", "/gifts", "Подарки"],
  ] as const) {
    await tabs.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(dock).toBeVisible();
  }

  await tabs.getByRole("link", { name: "Брейни" }).click();
  await expect(page).toHaveURL(/\/brainy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Мой Брейни" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Брейни" })).toBeVisible();
  await expect(dock).toHaveCount(0);

  // The dock's Brainy opens the Brainy tab.
  await page.goto("/gifts");
  await page.getByRole("link", { name: "Открыть Брейни" }).click();
  await expect(page).toHaveURL(/\/brainy$/);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test("a game opens fullscreen from Learn and exits back", async ({ page }) => {
  await page.goto("/learn");
  await page.getByRole("link", { name: "с 4 лет Найди лишний Внимание", exact: true }).click();
  await expect(page).toHaveURL(/\/game\/odd-one-out$/);
  await expect(page.getByRole("navigation", { name: "Разделы" })).toHaveCount(0);
  await expect(page.getByTestId("brainy-dock")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Фигура \d+$/ })).toHaveCount(9);
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/learn$/);
});

test("unknown games return 404", async ({ page }) => {
  const response = await page.goto("/game/not-a-game");
  expect(response?.status()).toBe(404);
});
