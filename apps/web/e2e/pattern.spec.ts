import { expect, test } from "@playwright/test";
import { generateRounds } from "../../../packages/games/src/continue-pattern/rounds";
import { readyState } from "./saved-state";

for (const level of [1, 2]) {
  test(`pattern level ${level} reports corrections once and grows Brainy`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/game/continue-pattern?level=${level}&seed=42`);
    const before = await readyState(page);
    const rounds = generateRounds(level, 42);
    for (const [index, round] of rounds.entries()) {
      const answers = page.getByRole("button", { name: /^Option \d+$/ });
      await expect(answers).toHaveCount(3);
      if (index === 0) {
        const wrong = (round.answerIndex + 1) % 3;
        await answers.nth(wrong).click();
        await expect(page.getByText("Almost! Look closely and try again")).toBeVisible();
        if (level === 2)
          await page.screenshot({ path: testInfo.outputPath("pattern.png"), fullPage: true });
      }
      await answers.nth(round.answerIndex).click();
      if (index === 0) await expect(page.getByText("Star for correction! +4 ★")).toBeVisible();
      await page.getByRole("button", { name: /^(Next|Done)$/ }).click();
    }
    const brain = Math.min(100, before.progress.stats.brain + 2);
    const gain = brain - before.progress.stats.brain;
    if (gain > 0) await expect(page.getByTestId("stat-gain-brain")).toContainText(`Brain +${gain}`);
    else await expect(page.getByText("Brainy has already mastered this skill!")).toBeVisible();
    await expect(page.getByTestId("earned-stars")).toContainText("+13");
    await expect(page.getByTestId("practice-game")).toHaveAttribute(
      "href",
      /\/game\/(odd-one-out|continue-pattern|picture-puzzle)\?/,
    );
    await expect(page.getByTestId("next-level")).toHaveText(
      level === 1 ? /Next level/ : /Play again/,
    );
    await page.getByRole("button", { name: "Enough for today" }).click();
    await expect(page.getByTestId("brainy-stat-brain")).toHaveText(String(brain));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}

test("pattern uses the lab contract and deterministic seed controls", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("combobox", { name: "Game", exact: true }).selectOption("continue-pattern");
  const stream = page.getByTestId("event-stream");
  await expect(stream).toHaveAttribute("data-status", "running");
  const sequence = page.getByRole("list", { name: "Pattern", exact: true });
  await expect(sequence).toBeVisible();
  const first = await sequence.innerHTML();
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(sequence).toHaveJSProperty("innerHTML", first);
  for (const round of generateRounds(1, 42)) {
    await page
      .getByRole("button", { name: `Option ${round.answerIndex + 1}`, exact: true })
      .click();
    await page.getByRole("button", { name: /^(Next|Done)$/ }).click();
  }
  await expect(stream).toHaveAttribute("data-status", "finished");
  await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
  await expect(stream.locator('[data-event="finish"]')).toContainText(
    '"gameId":"continue-pattern"',
  );
  await expect(stream.locator('[data-event="round"]', { hasText: "correct=true" })).toHaveCount(4);
});
