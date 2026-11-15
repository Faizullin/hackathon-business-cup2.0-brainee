import { expect, type FrameLocator, type Page, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { GAMES, view } from "./phaser-preview";
import { savedState } from "./saved-state";

for (const game of GAMES)
  test(`${game.id}: Explore preview plays with real input, stays English, own origin, no rewards`, async ({
    page,
    baseURL,
  }, info) => {
    await newFamily(page.request, baseURL as string);
    const before = await savedState(page.request);
    const errors: string[] = [],
      foreign: string[] = [],
      scoring: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.protocol.startsWith("http") && u.origin !== baseURL) foreign.push(r.url());
      if (u.pathname.startsWith("/api/sessions")) scoring.push(r.url());
    });
    await page.goto(`/explore/${game.id}`);
    const iframe = page.getByTestId("explore-frame");
    await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
    await expect(iframe).toHaveAttribute("allow", /microphone 'none'/);
    const frame: FrameLocator = page.frameLocator('[data-testid="explore-frame"]');
    await expect.poll(async () => (await view(page, game.scene)).ready).toBe(true);
    // English-only menu: no language picker, no Cyrillic copy.
    await expect(frame.locator("#game-language")).toHaveCount(0);
    expect(await frame.locator("body").textContent()).not.toMatch(/[Ѐ-ӿ]/);
    await frame.locator("#start-game").click({ delay: 40 });
    await expect.poll(async () => (await view(page, game.scene)).menuOpen).toBe(false);
    await page.screenshot({ path: info.outputPath(`${game.id}-start.png`) });
    await game.play(page);
    await page.screenshot({ path: info.outputPath(`${game.id}-play.png`) });

    await page.getByRole("link", { name: /Exit/ }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByTestId("explore-frame")).toHaveCount(0);
    const after = await savedState(page.request);
    expect(after.progress.wallet).toEqual(before.progress.wallet);
    expect(after.progress.skills).toEqual(before.progress.skills);
    expect(after.progress.stats).toEqual(before.progress.stats);
    expect(scoring).toEqual([]);
    expect(foreign).toEqual([]);
    expect(errors).toEqual([]);
  });
