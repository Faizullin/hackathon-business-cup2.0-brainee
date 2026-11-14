import { expect, test } from "@playwright/test";

// The lab is the game harness: assertions read the event stream, not game text.
test("odd-one-out plays to the end in the lab and reports a valid result", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/lab");
  const stream = page.getByTestId("event-stream");
  await expect(stream).toHaveAttribute("data-status", "running");

  for (let round = 0; round < 4; round++) {
    const next = page.getByRole("button", { name: /^(Дальше|Готово)$/ });
    const cells = page.getByRole("button", { name: /^Фигура \d+$/ });
    const count = await cells.count();
    expect(count).toBe(9);
    // Tap cells in order until the odd one is found (this also exercises mistakes).
    for (let i = 0; i < count && !(await next.isVisible()); i++) {
      await cells.nth(i).click();
    }
    await next.click();
  }

  await expect(stream).toHaveAttribute("data-status", "finished");
  await expect(stream.locator('[data-event="round"]', { hasText: "correct=true" })).toHaveCount(4);
  const finish = stream.locator('[data-event="finish"]');
  await expect(finish).toContainText('"gameId":"odd-one-out"');
  await expect(finish).toContainText('"rounds":4');
  await expect(stream).toContainText("★");
  expect(errors).toEqual([]);
});

test("the same seed replays the same board; level 2 uses 12 cells", async ({ page }) => {
  await page.goto("/lab");
  const board = () =>
    page
      .locator('[data-game="odd-one-out"] svg')
      .evaluateAll((els) => els.map((e) => e.innerHTML).join("|"));
  const first = await board();
  await page.getByRole("button", { name: "Перезапустить" }).click();
  expect(await board()).toBe(first);

  await page.getByLabel("Уровень").selectOption("2");
  await expect(page.getByRole("button", { name: /^Фигура \d+$/ })).toHaveCount(12);
});
