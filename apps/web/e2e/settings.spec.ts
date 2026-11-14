import { pathToFileURL } from "node:url";
import { getDatabaseConfig, openDatabase } from "@brainee/db";
import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";

test("settings save child, PIN, zone; pair and revoke a child device; adult gate and logout", async ({
  page,
  browser,
  baseURL,
}, info) => {
  const headers = { origin: baseURL as string };
  await newFamily(page.request, baseURL as string);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Настройки", exact: true })).toBeVisible();
  await page.getByLabel("Имя ребёнка", { exact: true }).fill("Лея");
  await page.getByLabel("Обещание ребёнка: заданий в день").fill("2");
  await page.getByRole("button", { name: "Сохранить", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Лея", exact: true })).toBeVisible();
  await page.getByLabel("Текущий PIN").fill("9999");
  await page.getByLabel("Новый PIN (4 цифры)").fill("2468");
  await page.getByRole("button", { name: "Изменить PIN" }).click();
  await expect(page.getByRole("status")).toHaveText("Текущий PIN неверный");
  await page.getByLabel("Текущий PIN").fill("1234");
  await page.getByRole("button", { name: "Изменить PIN" }).click();
  await expect(page.getByRole("status")).toHaveText("Сохранено");
  await page.getByRole("combobox", { name: "Часовой пояс" }).selectOption("America/Los_Angeles");
  await page.getByRole("button", { name: "Сохранить", exact: true }).last().click();
  await expect
    .poll(async () => (await savedState(page.request)).showcase.calendar?.timeZone)
    .toBe("America/Los_Angeles");
  await page.getByRole("button", { name: "Новый код" }).click();
  const code = await page.getByTestId("pairing-code").textContent();
  const child = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  try {
    const device = await child.newPage();
    await device.goto("/child-login");
    await device.getByLabel("Код из 6 цифр").fill(code ?? "");
    await device.getByRole("button", { name: "Подключить", exact: true }).click();
    await expect(device).toHaveURL(/\/entry$/);
    const childState = await savedState(device.request);
    expect(childState.child.name).toBe("Лея");
    expect(childState.parentUnlocked).toBe(false);
    expect((await device.request.get("/api/settings")).status()).toBe(401);
    expect(
      (
        await device.request.post("/api/settings", {
          headers,
          data: { type: "child", child: { name: "Wrong", birthYear: 2020, promise: 1 } },
        })
      ).status(),
    ).toBe(401);
    await page.reload();
    await expect(page.getByRole("button", { name: "Отключить", exact: true })).toHaveCount(2);
    await page.screenshot({
      path: info.outputPath("settings.png"),
      fullPage: true,
      animations: "disabled",
    });
    const row = page
      .getByRole("listitem")
      .filter({ hasText: "Устройство" })
      .filter({ hasNotText: "Это устройство" });
    await row.getByRole("button", { name: "Отключить" }).click();
    await expect(device).toHaveURL(/\/login$/, { timeout: 10000 });
    await device.goto("/learn");
    await expect(device).toHaveURL(/\/login$/, { timeout: 10000 });
  } finally {
    await child.close();
  }
  await page.request.delete("/api/parent", { headers });
  await page.reload();
  for (const digit of "1234") await page.getByRole("button", { name: `Цифра ${digit}` }).click();
  await expect(page.getByText("Неверный PIN. Попробуй ещё раз.", { exact: true })).toBeVisible();
  for (const digit of "2468") await page.getByRole("button", { name: `Цифра ${digit}` }).click();
  await expect(page.getByLabel("Имя ребёнка", { exact: true })).toBeVisible();
  await page.request.delete("/api/parent", { headers });
  await page.reload();
  await page.getByRole("button", { name: "Забыли PIN? Задача для взрослого" }).click();
  await page.getByLabel("Ответ на задачу").fill("67");
  await page.getByRole("button", { name: "Открыть кабинет" }).click();
  await expect(
    page.getByText("Ответ не подошёл. Попробуйте ещё раз.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Ответ на задачу").fill("68");
  await page.getByRole("button", { name: "Открыть кабинет" }).click();
  await expect(page.getByLabel("Имя ребёнка", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Выйти", exact: true }).last().click();
  await expect(page).toHaveURL(/\/login$/);
});

test("selected timezone drives midnight and Monday resets, and a higher stage celebrates", async ({
  page,
  baseURL,
}, info) => {
  const headers = { origin: baseURL as string };
  await newFamily(page.request, baseURL as string);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Часовой пояс" }).selectOption("America/Phoenix");
  await page.getByRole("button", { name: "Сохранить", exact: true }).last().click();
  await expect
    .poll(async () => (await savedState(page.request)).showcase.calendar?.timeZone)
    .toBe("America/Phoenix");
  const before = await savedState(page.request);
  const connection = await openDatabase(
    getDatabaseConfig(pathToFileURL(info.config.metadata.databasePath as string).href),
  );
  try {
    await connection.client.execute({
      sql: "UPDATE showcases SET data = json_set(data, '$.calendar.day', '2020-01-01', '$.calendar.week', '2019-12-30', '$.weekGoal.earned', 5) WHERE child_id = ?",
      args: [before.child.id],
    });
    const after = await savedState(page.request);
    expect(after.showcase.weekGoal.earned).toBe(0);
    expect(after.showcase.calendar?.timeZone).toBe("America/Phoenix");
    await connection.client.execute({
      sql: "UPDATE brainy_states SET brain=24.8,eyes=24.8,mouth=24.8,arms=24.8,legs=24.8 WHERE child_id=?",
      args: [before.child.id],
    });
    await page.goto("/brainy");
    await expect(page.getByTestId("brainy-stat-eyes")).toBeVisible();
    const launch = await page.request.post("/api/sessions/start", {
      headers,
      data: { gameId: "odd-one-out", level: 1 },
    });
    const finish = await page.request.post("/api/sessions", {
      headers,
      data: {
        sessionId: (await launch.json()).sessionId,
        result: {
          gameId: "odd-one-out",
          level: 1,
          rounds: 4,
          mistakes: 0,
          corrections: 0,
          durationMs: 0,
        },
      },
    });
    expect(finish.status()).toBe(200);
    expect(
      (await savedState(page.request)).showcase.feed.some((item) => item.kind === "stage-up"),
    ).toBe(true);
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: info.outputPath("stage-up.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Здорово!" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    connection.client.close();
  }
});
