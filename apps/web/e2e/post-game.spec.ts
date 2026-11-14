import { expect, test } from "@playwright/test";
import { finishOddOneOut } from "./play-game";
import { readyState } from "./saved-state";

test("a finish saves Brainy and the shared wallet, with a real stopping point", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  const errors: string[] = [],
    writes: string[] = [],
    foreign: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(new URL(request.url()).pathname);
    if (new URL(request.url()).origin !== baseURL) foreign.push(request.url());
  });
  await page.goto("/game/odd-one-out?level=1&seed=42");
  const before = await readyState(page);
  await finishOddOneOut(page);
  const eyes = Math.min(100, before.progress.stats.eyes + 3);
  const gain = eyes - before.progress.stats.eyes;
  const stars = before.progress.wallet.stars + 12;
  await expect(page.getByRole("img", { name: "До игры" })).toBeVisible();
  await expect(page.getByRole("img", { name: "После игры" })).toBeVisible();
  if (gain > 0) {
    await expect(page.getByTestId("stat-gain-eyes")).toContainText(`Глаза +${gain}`);
    await expect(page.getByTestId("stat-gain-eyes")).toContainText(
      `${before.progress.stats.eyes} → ${eyes}`,
    );
  } else await expect(page.getByText("Брейни уже освоил этот навык!")).toBeVisible();
  await expect(page.getByTestId("earned-stars")).toContainText("+12");
  await expect(page.getByText(`Теперь у тебя ${stars} ★`)).toBeVisible();
  await expect(page.getByTestId("next-level")).toHaveAttribute("href", /level=2/);
  await expect(page.getByTestId("practice-game")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("post-game.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Хватит на сегодня" }).click();
  await expect(page).toHaveURL(/\/brainy$/);
  await expect(page.getByRole("status")).toContainText("Спасибо за занятия");
  await expect(page.getByTestId("brainy-stat-eyes")).toHaveText(String(eyes));
  await page.getByRole("navigation").getByRole("link", { name: "Учимся" }).click();
  await expect(page.getByTestId("wallet-stars")).toContainText(String(stars));
  await page.reload();
  await expect(page.getByTestId("wallet-stars")).toContainText(String(stars));
  const otherTab = await context.newPage();
  await otherTab.goto("/learn");
  await expect(otherTab.getByTestId("wallet-stars")).toContainText(String(stars));
  await otherTab.close();
  expect(writes.filter((path) => path === "/api/sessions")).toHaveLength(1);
  expect(
    writes.every((path) =>
      ["/api/demo-session", "/api/sessions/start", "/api/sessions", "/api/sessions/stop"].includes(
        path,
      ),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

test("three completed games offer a break and save exactly one bonus", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/game/odd-one-out?level=1&seed=7");
  const before = await readyState(page);
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
  await expect(
    page.getByText(`Теперь у тебя ${before.progress.wallet.stars + 41} ★`),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("break.png"), fullPage: true });
  await page.getByRole("button", { name: "Сделать перерыв" }).click();
  await expect(page.getByTestId("brainy-stat-eyes")).toHaveText(
    // D-23 level budget: L1 +3, L2 +4, L1 +3.
    String(Math.min(100, before.progress.stats.eyes + 10)),
  );
  await page.getByRole("navigation").getByRole("link", { name: "Учимся" }).click();
  await expect(page.getByTestId("wallet-stars")).toContainText(
    String(before.progress.wallet.stars + 41),
  );
  await page.getByRole("link", { name: "с 4 лет Найди лишний Внимание", exact: true }).click();
  await finishOddOneOut(page);
  await expect(page.getByTestId("streak-bonus")).toHaveCount(0);
  await expect(
    page.getByText(`Теперь у тебя ${before.progress.wallet.stars + 53} ★`),
  ).toBeVisible();
});
