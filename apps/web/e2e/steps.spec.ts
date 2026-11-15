import { expect, test } from "@playwright/test";

test("step focus, keyboard radio choices, disabled action and responsive layout", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab/steps");
  await expect(page.getByRole("heading", { name: "Choose a starting point" })).toBeFocused();
  const next = page.getByRole("button", { name: "Continue" });
  await expect(next).toBeDisabled();
  const first = page.getByRole("radio", { name: "One puzzle together" });
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "A shared story" })).toBeChecked();
  await expect(next).toBeEnabled();
  await expect(page.getByRole("radio", { name: "A shared story" })).toHaveCSS(
    "background-color",
    "rgb(236, 232, 255)",
  );
  await page.screenshot({ path: info.outputPath("step-choice.png"), fullPage: true });
  await next.click();
  await expect(page.getByRole("heading", { name: "One small step is ready" })).toBeFocused();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("radio", { name: "A shared story" })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
