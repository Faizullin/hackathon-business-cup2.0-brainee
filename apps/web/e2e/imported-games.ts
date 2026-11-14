import { expect, type Page } from "@playwright/test";
import { solveReflectionPattern } from "./reflection";
import { getRhythmPattern, playRhythmInput } from "./rhythm-copycat";
import { getSecretMessagePattern, playSecretMessageInput } from "./secret-message-copy";
export async function importedRound(
  page: Page,
  id: string,
  level: number,
  round: number,
  wrong = false,
) {
  const iframe = page.getByTestId("embedded-game");
  await iframe.scrollIntoViewIfNeeded();
  const frame = iframe.contentFrame();
  if (id === "reflection") {
    if (wrong)
      await frame.getByRole("button", { name: "Проверить", exact: true }).click({ delay: 60 });
    else await solveReflectionPattern(page, frame);
  } else if (id === "rhythm-copycat")
    await playRhythmInput(frame, getRhythmPattern(level, round), wrong, round);
  else if (id === "secret-message-copy")
    await playSecretMessageInput(frame, getSecretMessagePattern(level, round), wrong, round);
  else throw new Error(`Unknown imported game ${id}`);
}
export async function launchLab(page: Page, id: string, level: number) {
  await page.goto("/lab");
  await page
    .getByRole("combobox", { name: "Экран", exact: true })
    .selectOption((page.viewportSize()?.width ?? 390) >= 768 ? "ipad" : "phone");
  await page.getByRole("combobox", { name: "Игра", exact: true }).selectOption(id);
  await page.getByRole("combobox", { name: "Уровень", exact: true }).selectOption(String(level));
  await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
    timeout: 10000,
  });
}
