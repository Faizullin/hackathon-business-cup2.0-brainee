import { expect, test } from "@playwright/test";

test("Brainy lab shows presets, stages, stat thresholds and accessories", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lab/brainy");

  const brainy = page.getByRole("img", { name: "Brainy" });
  const stage = page.getByTestId("brainy-stage");

  await page.getByRole("button", { name: "After quiz" }).click();
  await expect(stage).toContainText("Sleepy");
  await expect(brainy.locator('[data-part="zz"]')).toBeVisible();
  await expect(brainy.locator('[data-part="screen"]')).toHaveCount(3);

  await page.getByRole("button", { name: "Now" }).click();
  await expect(stage).toContainText("Smart");
  await expect(brainy.locator('[data-part="backpack"]')).toBeVisible();
  await expect(brainy.locator('[data-part="zz"]')).toHaveCount(0);

  await page.getByLabel("Eyes").fill("30");
  await expect(brainy.locator('[data-part="zz"]')).toBeVisible();

  await page.getByLabel("Head").selectOption("cowboy");
  await expect(brainy.locator('[data-acc="cowboy"]')).toBeVisible();
  await page.getByLabel("Head").selectOption("");
  await expect(brainy.locator('[data-acc="cowboy"]')).toHaveCount(0);

  await page.getByRole("link", { name: "Games" }).click();
  await expect(page.getByTestId("event-stream")).toBeVisible();
  expect(errors).toEqual([]);
});
