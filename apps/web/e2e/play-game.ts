import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { handleStageCelebration } from "./saved-state";

/** Solve by the visible SVG differences, without adding answer markers to the game. */
export async function answerOddOneOut(page: Page) {
  for (let round = 0; round < 4; round++) {
    const cells = page.getByRole("button", { name: /^Shape \d+$/ });
    await expect(cells.first()).toBeVisible();
    const shapes = await cells
      .locator("svg")
      .evaluateAll((elements) => elements.map((element) => element.innerHTML));
    const odd = shapes.findIndex((shape) => shapes.filter((other) => other === shape).length === 1);
    expect(odd).toBeGreaterThanOrEqual(0);
    await cells.nth(odd).click();
    await page.getByRole("button", { name: /^(Next|Done)$/ }).click();
  }
}

export async function finishOddOneOut(page: Page) {
  await handleStageCelebration(page);
  await answerOddOneOut(page);
  await expect(page.getByTestId("post-game")).toBeVisible();
}
