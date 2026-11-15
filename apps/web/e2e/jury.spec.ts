import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { answerOddOneOut } from "./play-game";
import { savedState } from "./saved-state";

test("jury joins in one tap; families stay isolated; game ten completes an app task and celebrates a real badge", async ({
  page,
  browser,
  baseURL,
}, info) => {
  const foreign: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== baseURL) foreign.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Войти как жюри" }).click();
  await expect(page).toHaveURL(/\/jury$/);
  await expect(page.getByTestId("jury-pin")).toHaveText(/^\d{4}$/);
  const a = await savedState(page.request);
  expect(a.activity?.completed).toBe(9);
  const other = await browser.newContext({ baseURL });
  try {
    expect(
      (await other.request.post("/api/jury", { headers: { origin: baseURL as string } })).status(),
    ).toBe(201);
    const b = await savedState(other.request);
    expect(b.child.id).not.toBe(a.child.id);
    await page.screenshot({
      path: info.outputPath("jury.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("link", { name: "Смотреть как ребёнок" }).click();
    await expect(page).toHaveURL(/\/entry$/);
    await page.goto("/brainy");
    await expect(page.getByText("Откроется: 9 / 10 игр", { exact: true })).toBeVisible();
    await page.goto("/game/odd-one-out?recommended=1&seed=42");
    await answerOddOneOut(page);
    await expect(page.getByRole("dialog", { name: "Новая награда!" })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText("Значок исследователя", { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: info.outputPath("earned.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Здорово!" }).click();
    const after = await savedState(page.request);
    expect(after.progress.wallet.stars).toBe(a.progress.wallet.stars + 27);
    expect(after.showcase.tasks.find((t) => t.id === "jury-app")?.status).toBe("done");
    expect(after.activity?.completed).toBe(10);
    expect(after.activity?.recommendedFinished).toBe(10);
    expect((await savedState(other.request)).progress.wallet).toEqual(b.progress.wallet);
    await page.goto("/analytics");
    await expect(page.getByTestId("computed-analytics")).toBeVisible();
    await expect(
      page.locator("li").filter({ hasText: "Средняя сессия концентрации" }),
    ).toContainText(`${after.activity?.focusMinutes} мин`);
    await expect(
      page.locator("li").filter({ hasText: "Выбирает рекомендации Брейни" }),
    ).toContainText(`${after.activity?.takesRecommendation}%`);
    await expect(page.getByText(/Доведено до конца: 10 из 10 рекомендованных игр/)).toBeVisible();
    await expect(page.getByTestId("event-feed")).toContainText("Значок исследователя");
    await page.screenshot({
      path: info.outputPath("analytics-real.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/settings");
    await page.getByRole("button", { name: "Сбросить демо" }).click();
    await expect(page.getByRole("status")).toHaveText("Сохранено");
    expect((await savedState(other.request)).child.id).toBe(b.child.id);
    expect(foreign).toEqual([]);
  } finally {
    await other.close();
  }
});

test("simple signup uses neutral stats and setup pairs another device", async ({
  page,
  browser,
  baseURL,
}, info) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Создать аккаунт без квиза" }).click();
  await page.getByLabel("Имя ребёнка", { exact: true }).fill("Лея");
  await page.getByLabel("Год рождения").fill(String(new Date().getFullYear() - 6));
  await page
    .getByLabel("Email", { exact: true })
    .fill(`simple-${Date.now()}-${info.project.name}@example.com`);
  await page.getByLabel("Пароль (минимум 6 символов)").fill("secret123");
  await page.getByLabel("PIN родителя (4 цифры)").fill("2468");
  await page
    .getByRole("combobox", { name: "Часовой пояс", exact: true })
    .selectOption("America/Chicago");
  await page.getByRole("button", { name: "Создать и начать" }).click();
  await expect(page).toHaveURL(/\/onboarding\/setup$/);
  const code = page.getByTestId("setup-code");
  await expect(code).toHaveText(/^\d{6}$/);
  const state = await savedState(page.request);
  expect(state.progress.stats.brain).toBe(17);
  expect(state.showcase.calendar?.timeZone).toBe("America/Chicago");
  await expect(page.getByText(baseURL as string, { exact: true })).toBeVisible();
  await page.screenshot({
    path: info.outputPath("setup.png"),
    fullPage: true,
    animations: "disabled",
  });
  const device = await browser.newContext({ baseURL });
  try {
    const child = await device.newPage();
    await child.goto("/child-login");
    await child.getByLabel("Код из 6 цифр").fill((await code.textContent()) ?? "");
    await child.getByRole("button", { name: "Подключить", exact: true }).click();
    await expect(child).toHaveURL(/\/entry$/);
    expect((await savedState(device.request)).child.id).toBe(state.child.id);
  } finally {
    await device.close();
  }
  await page.getByRole("button", { name: "Это и есть устройство ребёнка" }).click();
  await expect(page).toHaveURL(/\/entry$/);
  expect((await savedState(page.request)).parentUnlocked).toBe(false);
});

test("fun-game credit counts active play only", async ({ page, baseURL }, info) => {
  await newFamily(page.request, baseURL as string);
  const headers = { origin: baseURL as string };
  expect(
    (
      await page.request.post("/api/actions", {
        headers,
        data: { type: "unlock-fun", gameId: "snake", mode: "timed" },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("/fun/snake");
  await expect(page.getByTestId("fun-time")).toContainText("10:00");
  await page.getByRole("button", { name: "Играть", exact: true }).click();
  await expect(page.getByTestId("fun-time")).toContainText("9:59");
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await savedState(page.request)).showcase.fun.find((g) => g.id === "snake")
          ?.remainingSeconds,
    )
    .toBeLessThan(600);
  const left = (await savedState(page.request)).showcase.fun.find(
    (g) => g.id === "snake",
  )?.remainingSeconds;
  await page.screenshot({ path: info.outputPath("snake.png"), animations: "disabled" });
  await page.waitForTimeout(1200);
  expect(
    (await savedState(page.request)).showcase.fun.find((g) => g.id === "snake")?.remainingSeconds,
  ).toBe(left);
});
