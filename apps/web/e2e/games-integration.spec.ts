import { recommendGames, weightedSkillGains } from "@brainee/core";
import { previews } from "@brainee/game-catalog";
import { allGames } from "@brainee/games";
import { expect, test } from "@playwright/test";
import { importedRound } from "./imported-games";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";
import { completeTangram } from "./tangram";

const imported = ["tangram-tales", "reflection", "rhythm-copycat", "secret-message-copy"];
for (const id of imported) {
  test(`${id}: English launch, gains, parent progress, history recommendations and next level`, async ({
    page,
    baseURL,
  }, info) => {
    test.setTimeout(90000);
    await newFamily(page.request, baseURL as string, 8);
    const before = await savedState(page.request);
    const game = allGames.find((g) => g.id === id);
    if (!game) throw new Error(`Missing game ${id}`);
    await page.goto(`/game/${id}?level=1&seed=42`);
    await expect(page.getByRole("heading", { name: game.title, exact: true })).toBeVisible();
    await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
      timeout: 10000,
    });
    for (let round = 0; round < 4; round++) {
      if (id === "tangram-tales") await completeTangram(page);
      else await importedRound(page, id, 1, round);
    }
    await expect(page.getByTestId("post-game")).toBeVisible();
    const after = await savedState(page.request);
    expect(after.progress.wallet.stars - before.progress.wallet.stars).toBe(12);
    const gains = weightedSkillGains({ level: 1, rounds: 4, corrections: 0 }, game.weights);
    for (const [skill, gain] of Object.entries(gains)) {
      const key = skill as keyof typeof after.progress.skills;
      expect(after.progress.skills[key] - before.progress.skills[key]).toBe(gain);
    }
    expect(after.latestGame?.gameId).toBe(id);
    expect(after.learningHistory?.some((entry) => entry.gameId === id)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${id}-post-en.png`), fullPage: true });
    await page.getByTestId("next-level").click();
    await expect(page).toHaveURL(new RegExp(`/game/${id}\\?level=2`));
    await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
      timeout: 10000,
    });
    await page.getByRole("button", { name: /Exit/ }).click();
    await expect(page).toHaveURL(/\/learn$/);
    expect((await savedState(page.request)).progress.wallet.stars).toBe(
      after.progress.wallet.stars,
    );
    const expected = recommendGames(
      after.progress.skills,
      after.showcase.ageAverages,
      allGames.filter((g) => g.minAge <= 8),
      after.learningHistory ?? [],
      Date.now(),
    );
    const links = page.getByTestId("recommended-game");
    for (let i = 0; i < expected.length; i++)
      await expect(links.nth(i)).toHaveAttribute(
        "href",
        `/game/${expected[i]?.game.id}?recommended=1`,
      );
    await page.goto("/analytics");
    await expect(page.getByTestId("parent-latest-game")).toContainText(game.title);
    await expect(page.getByTestId("parent-latest-game")).toContainText("+12");
  });
}

test("new catalog titles show; locked learning and Explore routes cannot launch", async ({
  page,
  baseURL,
}) => {
  await newFamily(page.request, baseURL as string, 4);
  await page.goto("/learn");
  await expect(page.getByText("Mirror Grid", { exact: true })).toBeVisible();
  for (const id of imported) {
    await expect(page.locator(`a[href="/game/${id}"]`)).toHaveCount(0);
    const response = await page.request.post("/api/sessions/start", {
      headers: { origin: baseURL as string },
      data: { gameId: id, level: 1, seed: 42 },
    });
    expect(response.status()).toBe(400);
  }
  await page.goto("/leisure");
  // A four-year-old: age-locked Explore games in the ★ shop have no buy buttons; 4+ ones do.
  for (const preview of previews) {
    const card = page.getByTestId(`fun-game-${preview.id}`);
    await expect(card.getByRole("button", { name: /10 min/ })).toHaveCount(
      preview.minAge > 4 ? 0 : 1,
    );
  }
  await page.goto("/explore/magnet-explorer");
  await expect(page.getByTestId("explore-frame")).toHaveCount(0);
  await expect(page.getByText(/Unlocks at age 6/)).toBeVisible();
});

test("iframe timeout and recovery preserve rewards", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string, 8);
  const before = await savedState(page.request);
  await page.route("**/games/reflection/index.html*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Silent game</title>",
    }),
  );
  await page.goto("/game/reflection?seed=42");
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "The game could not load. Please try again later.",
    { timeout: 12000 },
  );
  await expect(page.getByTestId("embedded-game")).toHaveCount(0);
  await page.unroute("**/games/reflection/index.html*");
  await page.reload();
  await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
    timeout: 10000,
  });
  expect((await savedState(page.request)).progress.wallet.stars).toBe(before.progress.wallet.stars);
});
