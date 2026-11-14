import { expect, test } from "@playwright/test";
import { generateRounds } from "../../../packages/games/src/continue-pattern/rounds";

for (const level of [1, 2]) {
  test(`pattern level ${level} reports corrections once and grows Brainy`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/game/continue-pattern?level=${level}&seed=42`);
    const rounds = generateRounds(level, 42);
    for (const [index, round] of rounds.entries()) {
      const answers = page.getByRole("button", { name: /^Ответ \d+$/ });
      await expect(answers).toHaveCount(3);
      if (index === 0) {
        const wrong = (round.answerIndex + 1) % 3;
        await answers.nth(wrong).click();
        await expect(page.getByText("Почти! Присмотрись и попробуй ещё раз")).toBeVisible();
        if (level === 2)
          await page.screenshot({ path: testInfo.outputPath("pattern.png"), fullPage: true });
      }
      await answers.nth(round.answerIndex).click();
      if (index === 0) await expect(page.getByText("Звезда за исправление! +4 ★")).toBeVisible();
      await page.getByRole("button", { name: /^(Дальше|Готово)$/ }).click();
    }
    await expect(page.getByTestId("stat-gain-brain")).toContainText("Мозг +2");
    await expect(page.getByTestId("earned-stars")).toContainText("+13");
    await expect(page.getByTestId("practice-game")).toHaveAttribute("href", /odd-one-out/);
    await expect(page.getByTestId("next-level")).toHaveText(
      level === 1 ? /Следующий уровень/ : /Сыграть ещё раз/,
    );
    await page.getByRole("link", { name: "Хватит на сегодня" }).click();
    await expect(page.getByTestId("brainy-stat-brain")).toHaveText("68");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}

test("pattern uses the lab contract and deterministic seed controls", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("combobox", { name: "Игра", exact: true }).selectOption("continue-pattern");
  const stream = page.getByTestId("event-stream");
  await expect(stream).toHaveAttribute("data-status", "running");
  const sequence = page.getByRole("list", { name: "Узор", exact: true });
  await expect(sequence).toBeVisible();
  const first = await sequence.innerHTML();
  await page.getByRole("button", { name: "Перезапустить" }).click();
  await expect(sequence).toHaveJSProperty("innerHTML", first);
  for (const round of generateRounds(1, 42)) {
    await page.getByRole("button", { name: `Ответ ${round.answerIndex + 1}`, exact: true }).click();
    await page.getByRole("button", { name: /^(Дальше|Готово)$/ }).click();
  }
  await expect(stream).toHaveAttribute("data-status", "finished");
  await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
  await expect(stream.locator('[data-event="finish"]')).toContainText(
    '"gameId":"continue-pattern"',
  );
  await expect(stream.locator('[data-event="round"]', { hasText: "correct=true" })).toHaveCount(4);
});
