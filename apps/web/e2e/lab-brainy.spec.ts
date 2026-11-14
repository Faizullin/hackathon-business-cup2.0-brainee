import { expect, test } from "@playwright/test";

test("Brainy lab shows presets, stages, stat thresholds and accessories", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lab/brainy");

  const brainy = page.getByRole("img", { name: "Брейни" });
  const stage = page.getByTestId("brainy-stage");

  await page.getByRole("button", { name: "После квиза" }).click();
  await expect(stage).toContainText("Сонный");
  await expect(brainy.locator('[data-part="zz"]')).toBeVisible();
  await expect(brainy.locator('[data-part="screen"]')).toHaveCount(3);

  await page.getByRole("button", { name: "Сейчас" }).click();
  await expect(stage).toContainText("Умник");
  await expect(brainy.locator('[data-part="backpack"]')).toBeVisible();
  await expect(brainy.locator('[data-part="zz"]')).toHaveCount(0);

  await page.getByLabel("Глаза").fill("30");
  await expect(brainy.locator('[data-part="zz"]')).toBeVisible();

  await page.getByLabel("Голова").selectOption("cowboy");
  await expect(brainy.locator('[data-acc="cowboy"]')).toBeVisible();
  await page.getByLabel("Голова").selectOption("");
  await expect(brainy.locator('[data-acc="cowboy"]')).toHaveCount(0);

  await page.getByRole("link", { name: "Игры" }).click();
  await expect(page.getByTestId("event-stream")).toBeVisible();
  expect(errors).toEqual([]);
});
