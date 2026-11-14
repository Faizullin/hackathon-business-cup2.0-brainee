import { expect, test } from "@playwright/test";
import { manifests } from "../../../packages/game-catalog/src";
import { generateRounds } from "../../../packages/games/src/continue-pattern/rounds";
import { importedRound } from "./imported-games";
import { placePuzzlePiece } from "./picture-puzzle";
import { answerOddOneOut } from "./play-game";
import { completeTangram } from "./tangram";

for (const game of manifests) {
  test(`${game.id}: ready, one finish, own-origin, no console errors`, async ({
    page,
    baseURL,
  }, info) => {
    test.setTimeout(90000);
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
    await page
      .getByRole("combobox", { name: "Screen", exact: true })
      .selectOption((page.viewportSize()?.width ?? 390) >= 768 ? "ipad" : "phone");
    await page.getByRole("combobox", { name: "Game", exact: true }).selectOption(game.id);
    const stream = page.getByTestId("event-stream");
    if (game.runtime === "embedded") {
      await expect(stream).toHaveAttribute("data-status", "connected", { timeout: 10000 });
      await page.getByRole("combobox", { name: "Level", exact: true }).selectOption("3");
      await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
        timeout: 10000,
      });
      await page.screenshot({ path: info.outputPath(`${game.id}-lab.png`), fullPage: false });
      for (let round = 0; round < game.roundsPerSession; round++) {
        if (game.id === "tangram-tales") await completeTangram(page);
        else if (game.id === "picture-puzzle") await placePuzzlePiece(page);
        else await importedRound(page, game.id, 3, round);
      }
    } else {
      await expect(page.locator(`[data-game="${game.id}"]`)).toBeVisible({ timeout: 10000 });
      if (game.id === "odd-one-out") await answerOddOneOut(page);
      else
        for (const round of generateRounds(1, 42)) {
          await page
            .getByRole("button", { name: `Option ${round.answerIndex + 1}`, exact: true })
            .click();
          await page.getByRole("button", { name: /^(Next|Done)$/ }).click();
        }
    }
    await expect(stream).toHaveAttribute("data-status", "finished");
    await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
  });
}
