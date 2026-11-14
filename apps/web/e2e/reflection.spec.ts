import { expect, test } from "@playwright/test";
import { solveReflectionPattern } from "./reflection";

test("reflection: ready <= 10s, failed check reports mistake, correction, 4 rounds and finish", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // Track network requests to ensure strictly same-origin
  const foreignRequests: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (
      url.protocol.startsWith("http") &&
      !url.host.includes("127.0.0.1") &&
      !url.host.includes("localhost")
    ) {
      foreignRequests.push(req.url());
    }
  });

  await page.goto("/games/reflection/harness.html?level=1&seed=42");

  const iframe = page.getByTestId("embedded-game");
  await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
  const frame = iframe.contentFrame();

  // Check initial prompt and touch target size >= 48px
  const checkBtn = frame.getByRole("button", { name: "Проверить", exact: true });
  await expect(checkBtn).toBeVisible();
  const box = await checkBtn.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(48);
  expect(box?.width).toBeGreaterThanOrEqual(48);

  // Failed Check before solving
  await checkBtn.click();
  await expect(frame.getByRole("status")).toContainText("Пока не совсем симметрично");

  const stream = page.getByTestId("event-stream");
  const mistakeEvent = stream.locator('[data-event="round"]').first();
  await expect(mistakeEvent).toContainText('"correct":false');

  // Complete round 1 with correction, then remaining 3 rounds
  for (let r = 0; r < 4; r++) {
    await solveReflectionPattern(page, frame);
  }

  // Finished
  await expect(stream).toHaveAttribute("data-status", "finished", { timeout: 5000 });
  const finishEvents = stream.locator('[data-event="finish"]');
  await expect(finishEvents).toHaveCount(1);
  await expect(finishEvents).toContainText('"gameId":"reflection"');
  await expect(finishEvents).toContainText('"level":1');
  await expect(finishEvents).toContainText('"rounds":4');
  await expect(finishEvents).toContainText('"mistakes":1');
  await expect(finishEvents).toContainText('"corrections":1');

  // No foreign requests or errors
  expect(foreignRequests).toEqual([]);
  expect(consoleErrors.filter((e) => !e.includes("favicon"))).toEqual([]);
});

for (const level of [2, 3]) {
  test(`reflection: level ${level} completes 4 rounds and emits finish`, async ({ page }) => {
    await page.goto(`/games/reflection/harness.html?level=${level}&seed=42`);
    const iframe = page.getByTestId("embedded-game");
    await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
    const frame = iframe.contentFrame();

    for (let r = 0; r < 4; r++) {
      await solveReflectionPattern(page, frame);
    }

    const stream = page.getByTestId("event-stream");
    await expect(stream).toHaveAttribute("data-status", "finished", { timeout: 5000 });
    const finish = stream.locator('[data-event="finish"]');
    await expect(finish).toHaveCount(1);
    await expect(finish).toContainText(`"level":${level},"rounds":4,"mistakes":0,"corrections":0`);
  });
}
