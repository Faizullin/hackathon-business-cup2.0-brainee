import { expect, test } from "@playwright/test";
import { fullDraft, openAt, typical } from "./funnel";

test("reveal, solution and offer show the child's Brainy with full effects only in the funnel", async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(new URL(r.url()).pathname);
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAt(page, "reveal");
  await expect(page.getByRole("heading", { name: "This is Leo’s Brainy today" })).toBeVisible();
  await expect(page.getByTestId("reveal-score")).toHaveAttribute("data-score", "24");
  await expect(page.locator(".sig-top", { hasText: "Focus" })).toBeVisible();
  await expect(page.getByText("A playful indicator, not a medical assessment.")).toBeVisible();
  await expect(page.locator('[data-brainy][data-effects="full"]').first()).toBeVisible();
  await page.screenshot({ path: info.outputPath("reveal.png") });
  await openAt(page, "solution");
  await expect(page.locator("figure[data-stage]")).toHaveCount(5);
  await expect(page.getByText("Leo today")).toBeVisible();
  await expect(page.getByText("In 4 weeks")).toBeVisible();
  await expect(page.getByText("Only our site stays open on the device")).toBeVisible();
  await page.screenshot({ path: info.outputPath("solution.png") });
  await openAt(page, "offer", { ...fullDraft, ...typical });
  await expect(page.getByTestId("starter-clock")).toBeVisible();
  const first = await page.getByTestId("starter-clock").textContent();
  await page.reload();
  await expect(page.getByTestId("starter-clock")).toBeVisible();
  const again = await page.getByTestId("starter-clock").textContent();
  // The deadline is stored once, so a reload never gives time back.
  expect((again ?? "").localeCompare(first ?? "")).toBeLessThanOrEqual(0);
  await expect(page.locator('input[type="password"], input[autocomplete^="cc-"]')).toHaveCount(0);
  expect(writes).toEqual([]);
});
