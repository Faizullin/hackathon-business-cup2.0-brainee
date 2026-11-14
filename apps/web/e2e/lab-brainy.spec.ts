import { expect, test } from "@playwright/test";

test("Brainy reference states, body controls and all accessories", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lab/brainy");
  const brainy = page.getByRole("img", { name: "Brainy", exact: true });
  await page.getByLabel("Animate hero").uncheck();
  for (const [mood, title] of [
    [92, "Ready to shine"],
    [62, "A steady pace"],
    [38, "Time to slow down"],
    [10, "A quiet rest"],
  ] as const) {
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await expect(brainy).toHaveAttribute("data-energy", String(mood));
    await expect(brainy).toHaveAttribute("data-effects", "kid");
    expect(await brainy.innerHTML()).not.toMatch(/#5F6B2E|#A9BC55/);
  }
  await page.getByLabel(/^Eyes/).fill("30");
  await expect(brainy.locator('[data-part="zz"]')).toBeVisible();
  for (const [slot, ids] of [
    ["Head", ["cowboy", "cap", "phones"]],
    ["Face", ["glasses"]],
    ["Neck", ["bowtie", "scarf"]],
  ] as const) {
    for (const id of ids) {
      await page.getByLabel(slot).selectOption(id);
      await expect(brainy.locator(`[data-acc="${id}"]`)).toBeVisible();
    }
    await page.getByLabel(slot).selectOption("");
  }
  await page.getByLabel("Stage", { exact: true }).fill("4");
  await page.getByLabel(/^Energy/).fill("92");
  await expect(page.getByTestId("brainy-stage")).toContainText("Genius");
  await page.screenshot({ path: testInfo.outputPath("brainy-reference.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Games", exact: true }).click();
  await expect(page.getByTestId("event-stream")).toBeVisible();
  expect(errors).toEqual([]);
});
test("only visible heroes animate and reduced motion stops the clock", async ({ page }) => {
  await page.goto("/lab/brainy");
  const brainy = page.getByRole("img", { name: "Brainy", exact: true });
  await expect.poll(async () => Number(await brainy.getAttribute("data-frame"))).toBeGreaterThan(0);
  await expect(page.locator('svg[data-brainy][aria-hidden="true"]').first()).toHaveAttribute(
    "data-frame",
    "0",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(brainy).toHaveAttribute("data-frame", "0");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => Number(await brainy.getAttribute("data-frame"))).toBeGreaterThan(0);
  await page.getByLabel("Animate hero").uncheck();
  await expect(brainy).toHaveAttribute("data-frame", "0");
});
