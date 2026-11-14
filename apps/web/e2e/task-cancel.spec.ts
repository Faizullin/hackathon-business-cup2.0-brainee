import { expect, test } from "@playwright/test";
import { savedState } from "./saved-state";

test("parent cancellation updates child badges without rewards; other statuses stay protected", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  await page.request.post("/api/parent", { headers, data: { pin: "1234" } });
  await page.request.post("/api/demo-reset", { headers });
  await page.request.delete("/api/parent", { headers });
  await page.goto("/gifts");
  const childBadge = page
    .getByRole("link", { name: "Подарки", exact: true })
    .getByTestId("navigation-badge");
  await expect(childBadge).toHaveText("2");
  const before = await savedState(page.request);
  expect(
    (
      await page.request.post("/api/actions", {
        headers,
        data: { type: "task-cancel", taskId: "t3" },
      })
    ).status(),
  ).toBe(401);
  const parentContext = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  try {
    const parent = await parentContext.newPage();
    await parent.goto("/tasks");
    await expect(parent.getByTestId("navigation-badge")).toHaveCount(0);
    for (const digit of "1234")
      await parent.getByRole("button", { name: `Цифра ${digit}` }).click();
    const nav = parent
      .getByRole("navigation", { name: "Разделы родителя" })
      .filter({ visible: true });
    await expect(
      nav.getByRole("link", { name: "Задания", exact: true }).getByTestId("navigation-badge"),
    ).toHaveText("1");
    await expect(
      nav
        .getByRole("link", { name: "Подарки и цель", exact: true })
        .getByTestId("navigation-badge"),
    ).toHaveCount(0);
    await parent.screenshot({
      path: testInfo.outputPath("parent-before-cancel.png"),
      fullPage: true,
    });
    await page.screenshot({ path: testInfo.outputPath("child-before-cancel.png"), fullPage: true });
    await parent
      .getByTestId("parent-task-t3")
      .getByRole("button", { name: "Отменить", exact: true })
      .click();
    await expect(parent.getByTestId("parent-task-t3")).toHaveCount(0);
    await expect(page.getByTestId("child-task-t3")).toHaveCount(0, { timeout: 10_000 });
    await expect(childBadge).toHaveText("1");
    const after = await savedState(page.request);
    expect(after.progress.wallet).toEqual(before.progress.wallet);
    expect(after.progress.stats).toEqual(before.progress.stats);
    expect(after.showcase.weekGoal).toEqual(before.showcase.weekGoal);
    for (const taskId of ["t1", "t2", "t3"]) {
      expect(
        (
          await parent.request.post("/api/actions", {
            headers,
            data: { type: "task-cancel", taskId },
          })
        ).status(),
      ).toBe(409);
    }
    await page.getByTestId("child-task-t4").getByRole("button", { name: "Готово!" }).click();
    await expect(childBadge).toHaveCount(0);
    await expect(
      nav.getByRole("link", { name: "Задания", exact: true }).getByTestId("navigation-badge"),
    ).toHaveText("2", { timeout: 10_000 });
    await parent.screenshot({ path: testInfo.outputPath("parent-badges.png"), fullPage: true });
    await page.screenshot({ path: testInfo.outputPath("child-badges.png"), fullPage: true });
  } finally {
    await parentContext.close();
  }
});
