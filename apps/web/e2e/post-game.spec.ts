import { expect, test } from "@playwright/test";
import { finishOddOneOut } from "./play-game";

test("a finish changes Brainy and the tab wallet, with a real stopping point", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  const errors: string[] = [];
  const writes: string[] = [];
  const foreign: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(request.url());
    if (new URL(request.url()).origin !== baseURL) foreign.push(request.url());
  });
  await page.goto("/game/odd-one-out?level=1&seed=42");
  await finishOddOneOut(page);
  await expect(page.getByRole("img", { name: "До игры" })).toBeVisible();
  await expect(page.getByRole("img", { name: "После игры" })).toBeVisible();
  await expect(page.getByTestId("stat-gain-eyes")).toContainText("Глаза +3");
  await expect(page.getByTestId("stat-gain-eyes")).toContainText("41 → 44");
  await expect(page.getByTestId("earned-stars")).toContainText("+12");
  await expect(page.getByText("Теперь у тебя 352 ★")).toBeVisible();
  await expect(page.getByTestId("next-level")).toHaveAttribute("href", /level=2/);
  await expect(page.getByTestId("practice-game")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("post-game.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Хватит на сегодня" }).click();
  await expect(page).toHaveURL(/\/brainy$/);
  await expect(page.getByRole("status")).toContainText("Спасибо за занятия");
  await expect(page.getByTestId("brainy-stat-eyes")).toHaveText("44");
  await page.getByRole("navigation").getByRole("link", { name: "Учимся" }).click();
  await expect(page.getByTestId("wallet-stars")).toContainText("352");
  await page.reload();
  await expect(page.getByTestId("wallet-stars")).toContainText("352");
  const otherTab = await context.newPage();
  await otherTab.goto("/learn");
  await expect(otherTab.getByTestId("wallet-stars")).toContainText("340");
  await otherTab.close();
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
  expect(foreign).toEqual([]);
});

test("three completed games offer a break and pay exactly one bonus", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/game/odd-one-out?level=1&seed=7");
  for (let game = 1; game <= 3; game++) {
    await finishOddOneOut(page);
    if (game < 3) {
      await expect(page.getByTestId("break-suggestion")).toHaveCount(0);
      await page.getByTestId("next-level").click();
      await expect(page.getByTestId("post-game")).toHaveCount(0);
    }
  }
  await expect(page.getByTestId("streak-bonus")).toHaveText("Бонус за 3 игры подряд: +5 ★");
  await expect(page.getByTestId("earned-stars")).toContainText("+17");
  await expect(page.getByText("Теперь у тебя 381 ★")).toBeVisible();
  await expect(page.getByTestId("next-level")).toContainText("Следующий уровень");
  await page.screenshot({ path: testInfo.outputPath("break.png"), fullPage: true });
  await page.getByRole("link", { name: "Сделать перерыв" }).click();
  await expect(page.getByTestId("brainy-stat-eyes")).toHaveText("50");
  await page.getByRole("navigation").getByRole("link", { name: "Учимся" }).click();
  await expect(page.getByTestId("wallet-stars")).toContainText("381");
  await page.getByRole("link", { name: /Найди лишний/ }).click();
  await finishOddOneOut(page);
  await expect(page.getByTestId("streak-bonus")).toHaveCount(0);
  await expect(page.getByText("Теперь у тебя 393 ★")).toBeVisible();
});
