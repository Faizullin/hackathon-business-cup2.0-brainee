import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

// D-24: quiz BEFORE the account; answers set the starting Brainy. Own minimal login.
test("quiz → signup creates a family with a quiz-based Brainy; the parent can log in again", async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/onboarding");
  for (let question = 0; question < 5; question++) {
    await expect(page.getByTestId("quiz-progress")).toHaveText(`Вопрос ${question + 1} из 5`);
    await page.getByRole("button").filter({ hasNotText: "Назад" }).nth(2).click();
  }
  await expect(page.getByRole("heading", { name: "Скролл-монстр" })).toBeVisible();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Знакомьтесь: ваш Брейни" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("onboarding-reveal.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Начать знакомство" }).click();
  await page.getByLabel("Код приглашения (необязательно)").fill("FRIEND");
  const email = `parent-${Date.now()}-${test.info().project.name}@example.com`;
  await page.getByLabel("Имя ребёнка").fill("Мира");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль (минимум 6 символов)").fill("secret123");
  await page.getByLabel("PIN родителя (4 цифры)").fill("2468");
  await page.getByRole("button", { name: "Создать и начать" }).click();
  await expect(page).toHaveURL(/\/entry$/);
  const state = await savedState(page.request);
  expect(state.child.name).toBe("Мира");
  expect(state.showcase.calendar?.timeZone).toBeTruthy();
  // All answers = 2 → sum 10: brain 10+10+4 = 24, capped body stats ≤ 40.
  expect(state.progress.stats.brain).toBe(24);
  expect(Math.max(...Object.values(state.progress.stats))).toBeLessThanOrEqual(40);
  expect(state.baseline).toEqual(state.progress.stats);
  expect(state.progress.wallet).toEqual({ stars: 50, suns: 0 });
  expect(state.parentUnlocked).toBe(true);

  const other = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  const parent = await other.newPage();
  await parent.goto("/login");
  await parent.getByLabel("Email").fill(email);
  await parent.getByLabel("Пароль").fill("wrong-password");
  await parent.getByRole("button", { name: "Войти" }).click();
  await expect(parent.getByText("Неверный email или пароль")).toBeVisible();
  await parent.getByLabel("Пароль").fill("secret123");
  await parent.getByRole("button", { name: "Войти" }).click();
  await expect(parent.getByRole("heading", { level: 1, name: "Аналитика" })).toBeVisible();
  await expect(parent.getByText("Мира, ")).toBeVisible();
  await expect(parent.getByTestId("needs-attention")).toContainText("Назначить задания на сегодня");
  await other.close();
});

test("a finished game moves the child's skills by the game's weights and lands in the parent feed", async ({
  page,
  baseURL,
}) => {
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  const before = await savedState(page.request);
  const start = await page.request.post("/api/sessions/start", {
    headers,
    data: { gameId: "continue-pattern", level: 1 },
  });
  const { sessionId } = await start.json();
  const finish = await page.request.post("/api/sessions", {
    headers,
    data: {
      sessionId,
      result: {
        gameId: "continue-pattern",
        level: 1,
        rounds: 4,
        mistakes: 0,
        corrections: 0,
        durationMs: 0,
      },
    },
  });
  const { completion } = await finish.json();
  // Weights 70% logic / 30% attention on a 3-point budget → logic +2, attention +1.
  expect(completion.skillGains).toEqual({ logic: 2, attention: 1 });
  const after = await savedState(page.request);
  expect(after.progress.skills.logic).toBe(Math.min(100, before.progress.skills.logic + 2));
  expect(after.progress.skills.attention).toBe(Math.min(100, before.progress.skills.attention + 1));
  expect(after.showcase.feed[0]).toMatchObject({ kind: "game", title: "Продолжи узор · 1" });
  await page.request.post("/api/sessions/stop", { headers });
});

test("login rejects unknown accounts and the demo account opens parent mode", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("mama@example.com");
  await page.getByLabel("Пароль").fill("demo1234");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Аналитика" })).toBeVisible();
  await expect(page.getByTestId("event-feed")).toBeVisible();
  await page.getByRole("button", { name: "Вернуть ребёнку" }).click();
  await expect(page).toHaveURL(/\/entry$/);
  expect((await savedState(page.request)).parentUnlocked).toBe(false);
});

test("onboarding goes back, reacts to answers and requires a sustained hold without reduced motion", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/onboarding");
  await page.getByRole("button").filter({ hasNotText: "Назад" }).nth(1).click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("Вопрос 2 из 5");
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("Вопрос 1 из 5");
  await page.screenshot({
    path: info.outputPath("onboarding-question.png"),
    animations: "disabled",
  });
  for (let i = 0; i < 5; i++)
    await page.getByRole("button").filter({ hasNotText: "Назад" }).nth(2).click();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  const hold = page.getByRole("button", { name: "Удерживай, чтобы начать" });
  await hold.click();
  await expect(page.getByLabel("Имя ребёнка", { exact: true })).toHaveCount(0);
  await hold.focus();
  await page.keyboard.down("Space");
  await expect(page.getByLabel("Имя ребёнка", { exact: true })).toBeVisible();
  await page.keyboard.up("Space");
  await page.screenshot({
    path: info.outputPath("onboarding-signup.png"),
    fullPage: true,
    animations: "disabled",
  });
});
