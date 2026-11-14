import { pathToFileURL } from "node:url";
import { getDatabaseConfig, openDatabase } from "@brainee/db";
import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

test("daily rollover reaches both devices, archives tasks and resets weekly progress", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  await page.request.post("/api/demo-reset", { headers });
  await page.goto("/gifts");
  await expect(page.getByTestId("child-task-t3")).toBeVisible();
  const before = await savedState(page.request);
  const context = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  const connection = await openDatabase(
    getDatabaseConfig(pathToFileURL(testInfo.config.metadata.databasePath as string).href),
  );
  try {
    await context.request.post("/api/demo-session", { headers });
    await context.request.post("/api/parent", { headers, data: { pin: "1234" } });
    const parent = await context.newPage();
    await parent.goto("/tasks");
    await expect(parent.getByTestId("parent-task-t3")).toBeVisible();
    // Age persisted data only; the real server clock and normal polling perform the rollover.
    await connection.client.execute({
      sql: "UPDATE showcases SET data = json_set(data, '$.calendar.day', '2020-01-01', '$.calendar.week', '2019-12-30', '$.calendar.bonusGiven', json('true')) WHERE child_id = ?",
      args: [before.child.id],
    });
    await expect(page.getByTestId("child-task-t3")).toHaveCount(0, { timeout: 10_000 });
    await expect(parent.getByText("На сегодня заданий пока нет.")).toBeVisible({ timeout: 10_000 });
    await expect(parent.getByTestId("task-limit")).toHaveText("Сегодня 0 из 5 заданий");
    await parent.getByText("История заданий", { exact: true }).click();
    await expect(
      parent.getByTestId("task-history").getByText("Срок истёк", { exact: true }),
    ).toHaveCount(3);
    await expect(parent.getByTestId("task-history").getByRole("button")).toHaveCount(0);
    const after = await savedState(page.request);
    expect(after.version).toBeGreaterThan(before.version);
    expect(after.progress.wallet).toEqual(before.progress.wallet);
    expect(after.progress.stats).toEqual(before.progress.stats);
    expect(after.progress.streak).toEqual({ inRow: 0, bonusGiven: false });
    expect(after.showcase.weekGoal).toEqual({ ...before.showcase.weekGoal, earned: 0 });
    expect(
      (
        await context.request.post("/api/actions", {
          headers,
          data: { type: "task-confirm", taskId: "t2" },
        })
      ).status(),
    ).toBe(409);
    await parent.evaluate(() => window.scrollTo(0, 0));
    await parent.screenshot({
      path: testInfo.outputPath("task-history.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.screenshot({
      path: testInfo.outputPath("new-week.png"),
      fullPage: true,
      animations: "disabled",
    });
    expect(await parent.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    connection.client.close();
    await context.close();
    await page.request.post("/api/demo-reset", { headers });
  }
});
