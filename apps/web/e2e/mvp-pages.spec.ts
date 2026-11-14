import { expect, test } from "@playwright/test";
import { finishOddOneOut } from "./play-game";
import { savedState } from "./saved-state";

// D-21 demo pages: every child/parent screen renders, key interactions persist and sync.
test.beforeEach(async ({ page, baseURL }) => {
  const headers = { origin: baseURL as string };
  expect((await page.request.post("/api/demo-session", { headers })).ok()).toBe(true);
  expect((await page.request.post("/api/demo-reset", { headers })).ok()).toBe(true);
});

test("entry screen recommends games, has no close button, and logs the choice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/entry$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Во что играем сейчас?" }),
  ).toBeVisible();
  await expect(page.getByText("Важнее всего сейчас")).toBeVisible();
  expect(await page.getByTestId("recommended-game").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("button", { name: /закрыть/i })).toHaveCount(0);
  const before = await savedState(page.request);
  await page.getByRole("link", { name: "Нет, хочу посмотреть другие игры" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Брейни советует" })).toBeVisible();
  await expect
    .poll(async () => (await savedState(page.request)).showcase.entryLog.other)
    .toBe(before.showcase.entryLog.other + 1);
});

test("child: accessory shop, gifts, exchange and a task waiting for the parent", async ({
  page,
}) => {
  await page.goto("/brainy");
  const before = await savedState(page.request);
  await page.getByRole("button", { name: /Купить · 50★/ }).click();
  await expect(page.getByRole("button", { name: "Снять" }).first()).toBeVisible();
  await expect
    .poll(async () => (await savedState(page.request)).progress.wallet.stars)
    .toBe(before.progress.wallet.stars - 50);

  await page.goto("/gifts");
  await expect(page.getByText(/Собери 10 солнышек и получи: Поход в кино/)).toBeVisible();
  const task = page.getByTestId("child-task-t3");
  await task.getByRole("button", { name: "Готово!" }).click();
  await expect(task).toContainText("Ждёт подтверждения");
  await page.getByRole("button", { name: "1 ☀ на 10 ★" }).click();
  await expect
    .poll(async () => (await savedState(page.request)).progress.wallet.suns)
    .toBe(before.progress.wallet.suns - 1);
});

test("leisure and science video: pause-only player, quiz pays once after the end", async ({
  page,
}) => {
  await page.goto("/leisure");
  await expect(page.getByRole("heading", { name: "Игры за звёзды" })).toBeVisible();
  await expect(page.getByText("Продолжить с 9 мин")).toBeVisible();
  await page.getByRole("link", { name: /Как живут пчёлы/ }).click();
  await expect(page).toHaveURL(/\/video\/bees$/);
  await expect(page.getByRole("slider")).toHaveCount(0);
  const before = await savedState(page.request);
  await page.clock.install();
  await page.getByRole("button", { name: "Смотреть", exact: true }).click();
  await page.clock.runFor(21_000);
  const quiz = page.getByTestId("video-quiz");
  await expect(quiz).toBeVisible();
  await quiz.getByRole("button", { name: "Воск" }).click();
  await expect(quiz.getByRole("button", { name: "Воск" })).toBeDisabled();
  await quiz.getByRole("button", { name: "Мёд" }).click();
  await expect(quiz.getByText("Верно! +15★ и Глаза +2")).toBeVisible();
  await expect
    .poll(async () => (await savedState(page.request)).progress.wallet.stars)
    .toBe(before.progress.wallet.stars + 15);
});

test("parent: PIN barrier, analytics, confirming a task and syncing to the child", async ({
  browser,
  page,
  baseURL,
}) => {
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { level: 1, name: "Вход для родителей" })).toBeVisible();
  for (const digit of "0000") await page.getByRole("button", { name: `Цифра ${digit}` }).click();
  await expect(page.getByText("Неверный PIN. Попробуй ещё раз.")).toBeVisible();
  for (const digit of "1234") await page.getByRole("button", { name: `Цифра ${digit}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Аналитика" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Умения" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Характер" })).toBeVisible();
  await page.getByRole("button", { name: "Город" }).click();
  await expect(page.getByText(/из 4 820/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const ranking = (await savedState(page.request)).showcase.analytics.ranking;
  for (const scope of Object.values(ranking))
    for (const table of Object.values(scope))
      for (const row of table.rows) expect(row.name).toMatch(/^\p{L}+ \p{L}\.$/u);

  // A second device: the child's view updates through polling, without reloading.
  const childContext = await browser.newContext({
    baseURL,
    viewport: page.viewportSize(),
    colorScheme: "light",
  });
  const child = await childContext.newPage();
  await child.goto("/gifts");
  const childTask = child.getByTestId("child-task-t2");
  await expect(childTask).toContainText("Ждёт подтверждения");
  const beforeTask = await savedState(child.request);
  const suns = beforeTask.progress.wallet.suns;

  await page
    .getByRole("navigation", { name: "Разделы родителя" })
    .last()
    .getByRole("link", { name: "Задания" })
    .click();
  const parentTask = page.getByTestId("parent-task-t2");
  await parentTask.getByRole("button", { name: "Подтвердить" }).click();
  await expect(parentTask).toContainText("Выполнено");
  await expect(childTask).toContainText("Выполнено", { timeout: 10_000 });
  const afterTask = await savedState(child.request);
  expect(afterTask.progress.wallet.suns).toBe(suns + 2);
  expect(afterTask.showcase.weekGoal.earned).toBe(beforeTask.showcase.weekGoal.earned + 2);
  expect(afterTask.progress.stats.resp).toBe(beforeTask.progress.stats.resp + 2);

  await page
    .getByRole("navigation", { name: "Разделы родителя" })
    .last()
    .getByRole("link", { name: "Подарки и цель" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Подарки и цель" })).toBeVisible();
  await childContext.close();
});

test("worn accessories follow Brainy to the dock and both post-game portraits", async ({
  page,
}) => {
  await page.goto("/brainy");
  await page.getByRole("button", { name: /Купить · 50★/ }).click();
  const item = page.locator("li").filter({ hasText: "Бабочка" });
  await item.getByRole("button", { name: "Снять", exact: true }).click();
  await item.getByRole("button", { name: "Надеть", exact: true }).click();
  await expect(item.getByRole("button", { name: "Снять", exact: true })).toBeVisible();
  const equipped = (await savedState(page.request)).showcase.equipped;
  const accessory = Object.values(equipped).find((id) => id !== "glasses");
  expect(accessory).toBeTruthy();
  await page.goto("/learn");
  await expect(page.getByTestId("brainy-dock").locator(`[data-acc="${accessory}"]`)).toBeVisible();
  await page.goto("/game/odd-one-out?seed=42");
  await finishOddOneOut(page);
  await expect(page.getByTestId("post-game").locator(`[data-acc="${accessory}"]`)).toHaveCount(2);
});

test("closing a paused science video restores its saved position without paying stars", async ({
  page,
}) => {
  await page.goto("/video/bees");
  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  const before = await savedState(page.request);
  await page.clock.install();
  await page.getByRole("button", { name: "Смотреть", exact: true }).click();
  await page.clock.runFor(3000);
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  const position = await progress.getAttribute("aria-valuenow");
  expect(Number(position)).toBeGreaterThan(0);
  await page.clock.runFor(2000);
  await expect(progress).toHaveAttribute("aria-valuenow", String(position));
  await page.getByRole("button", { name: "Закрыть и досмотреть позже" }).click();
  await expect(page).toHaveURL(/\/leisure$/);
  await page.goto("/video/bees");
  await expect(progress).toHaveAttribute("aria-valuenow", String(position));
  expect((await savedState(page.request)).progress.wallet.stars).toBe(before.progress.wallet.stars);
});

test("rankings never appear on child routes, even after parent access", async ({
  page,
  baseURL,
}) => {
  await page.request.post("/api/parent", {
    headers: { origin: baseURL as string },
    data: { pin: "1234" },
  });
  for (const path of [
    "/entry",
    "/learn",
    "/brainy",
    "/gifts",
    "/leisure",
    "/video/bees",
    "/game/odd-one-out",
    "/game/continue-pattern",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Рейтинг", exact: true })).toHaveCount(0);
    await expect(page.getByText(/из 4 820|Рейтинг по|место в рейтинге/)).toHaveCount(0);
  }
});
