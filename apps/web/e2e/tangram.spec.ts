import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";
import { completeTangram } from "./tangram";

test("tangram: failed check, correction, four silhouettes and one saved reward", async ({
  page,
  baseURL,
}, info) => {
  await newFamily(page.request, baseURL as string);
  const before = await savedState(page.request);
  const finishes: unknown[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/sessions" && request.method() === "POST")
      finishes.push(request.postDataJSON());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/game/tangram-tales?level=3&seed=42");
  await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
    timeout: 10000,
  });
  const frame = page.getByTestId("embedded-game").contentFrame();
  await page.screenshot({ path: info.outputPath("tangram-play.png"), fullPage: false });
  await frame.getByRole("button", { name: "Проверить", exact: true }).click();
  await expect(frame.getByRole("status")).toContainText("Ещё остались детали");
  await page.screenshot({ path: info.outputPath("tangram-check.png"), fullPage: false });
  for (let round = 0; round < 4; round++) await completeTangram(page);
  await expect(page.getByTestId("post-game")).toBeVisible();
  expect(finishes).toHaveLength(1);
  const after = await savedState(page.request);
  expect(after.progress.wallet.stars).toBe(before.progress.wallet.stars + 13);
  expect(JSON.stringify(finishes[0])).toContain('"corrections":1');
  expect(JSON.stringify(finishes[0])).toContain('"mistakes":1');
  const replay = await page.request.post("/api/sessions", {
    headers: { origin: baseURL as string },
    data: finishes[0],
  });
  expect(replay.ok()).toBe(true);
  expect((await savedState(page.request)).progress.wallet.stars).toBe(after.progress.wallet.stars);
});

test("tangram: leaving after a failed check does not save a result", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  const before = await savedState(page.request);
  await page.goto("/game/tangram-tales?level=1&seed=42");
  await page
    .getByTestId("embedded-game")
    .contentFrame()
    .getByRole("button", { name: "Проверить", exact: true })
    .click();
  await page.getByRole("button", { name: /Выйти/ }).click();
  await expect(page).toHaveURL(/\/learn$/);
  expect((await savedState(page.request)).progress.wallet.stars).toBe(before.progress.wallet.stars);
});

for (const level of [1, 2]) {
  test(`tangram: level ${level}, repeated checks count one corrected silhouette`, async ({
    page,
  }) => {
    await page.goto("/lab");
    await page
      .getByRole("combobox", { name: "Экран", exact: true })
      .selectOption((page.viewportSize()?.width ?? 390) >= 768 ? "ipad" : "phone");
    await page.getByRole("combobox", { name: "Игра", exact: true }).selectOption("tangram-tales");
    await page.getByRole("combobox", { name: "Уровень", exact: true }).selectOption(String(level));
    await page.getByTestId("embedded-game").scrollIntoViewIfNeeded();
    const frame = page.getByTestId("embedded-game").contentFrame();
    await expect(frame.locator(".tray-piece")).toHaveCount(level + 3);
    await frame.getByRole("button", { name: "Проверить", exact: true }).click();
    await frame.getByRole("button", { name: "Проверить", exact: true }).click();
    for (let round = 0; round < 4; round++) await completeTangram(page);
    const stream = page.getByTestId("event-stream");
    await expect(stream).toHaveAttribute("data-status", "finished");
    const finish = stream.locator('[data-event="finish"]');
    await expect(finish).toHaveCount(1);
    await expect(finish).toContainText(`"level":${level},"rounds":4,"mistakes":2,"corrections":1`);
  });
}
