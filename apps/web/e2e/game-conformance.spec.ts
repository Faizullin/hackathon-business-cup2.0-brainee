import { expect, test } from "@playwright/test";
import { manifests } from "../../../packages/game-catalog/src";
import { generateRounds } from "../../../packages/games/src/continue-pattern/rounds";
import { placePuzzlePiece } from "./picture-puzzle";
import { answerOddOneOut } from "./play-game";
import { completeTangram } from "./tangram";

for (const game of manifests) {
  test(`${game.id}: ready, one finish, own-origin, no console errors`, async ({
    page,
    baseURL,
  }, info) => {
    const errors: string[] = [],
      foreign: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== baseURL) foreign.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/lab");
    await page.getByRole("combobox", { name: "Игра", exact: true }).selectOption(game.id);
    const stream = page.getByTestId("event-stream");
    if (game.runtime === "embedded") {
      await expect(stream).toHaveAttribute("data-status", "connected", { timeout: 10000 });
      await page.getByRole("combobox", { name: "Уровень", exact: true }).selectOption("3");
      await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
        timeout: 10000,
      });
      await page.screenshot({ path: info.outputPath(`${game.id}-lab.png`), fullPage: true });
      for (let round = 0; round < game.roundsPerSession; round++) {
        if (game.id === "tangram-tales") await completeTangram(page);
        else await placePuzzlePiece(page);
      }
    } else {
      await expect(page.locator(`[data-game="${game.id}"]`)).toBeVisible({ timeout: 10000 });
      if (game.id === "odd-one-out") await answerOddOneOut(page);
      else
        for (const round of generateRounds(1, 42)) {
          await page
            .getByRole("button", { name: `Ответ ${round.answerIndex + 1}`, exact: true })
            .click();
          await page.getByRole("button", { name: /^(Дальше|Готово)$/ }).click();
        }
    }
    await expect(stream).toHaveAttribute("data-status", "finished");
    await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
  });
}
