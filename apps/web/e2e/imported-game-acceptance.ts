import { expect, test } from "@playwright/test";
import { importedRound, launchLab } from "./imported-games";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";
export function gameAcceptance(id: string, age: number) {
  test(`${id}: mistake, correction, four rounds and exactly one saved reward`, async ({
    page,
    baseURL,
  }, info) => {
    test.setTimeout(90000);
    await newFamily(page.request, baseURL as string, age);
    const before = await savedState(page.request);
    const finishes: unknown[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/api/sessions" && r.method() === "POST")
        finishes.push(r.postDataJSON());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/game/${id}?level=1&seed=42`);
    await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
      timeout: 10000,
    });
    await page.screenshot({ path: info.outputPath(`${id}-play.png`), fullPage: false });
    await importedRound(page, id, 1, 0, true);
    for (let round = 0; round < 4; round++) await importedRound(page, id, 1, round);
    await expect(page.getByTestId("post-game")).toBeVisible();
    expect(finishes).toHaveLength(1);
    expect(JSON.stringify(finishes[0])).toContain('"mistakes":1');
    expect(JSON.stringify(finishes[0])).toContain('"corrections":1');
    const after = await savedState(page.request);
    expect(after.progress.wallet.stars).toBe(before.progress.wallet.stars + 13);
    const replay = await page.request.post("/api/sessions", {
      headers: { origin: baseURL as string },
      data: finishes[0],
    });
    expect(replay.ok()).toBe(true);
    expect((await savedState(page.request)).progress.wallet.stars).toBe(
      after.progress.wallet.stars,
    );
  });
  test(`${id}: level two finishes once`, async ({ page }) => {
    test.setTimeout(90000);
    await launchLab(page, id, 2);
    for (let round = 0; round < 4; round++) await importedRound(page, id, 2, round);
    const stream = page.getByTestId("event-stream");
    await expect(stream).toHaveAttribute("data-status", "finished");
    await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
    await expect(stream.locator('[data-event="finish"]')).toContainText(
      '"level":2,"rounds":4,"mistakes":0,"corrections":0',
    );
  });
  test(`${id}: exit before completion grants no reward`, async ({ page, baseURL }) => {
    await newFamily(page.request, baseURL as string, age);
    const before = await savedState(page.request);
    let finishes = 0;
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/api/sessions" && r.method() === "POST") finishes++;
    });
    await page.goto(`/game/${id}?level=1&seed=42`);
    await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
      timeout: 10000,
    });
    await page.getByRole("button", { name: /Exit/ }).click();
    await expect(page).toHaveURL(/\/learn$/);
    expect(finishes).toBe(0);
    expect((await savedState(page.request)).progress.wallet.stars).toBe(
      before.progress.wallet.stars,
    );
  });
}
