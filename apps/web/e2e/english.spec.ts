import { previews } from "@brainee/game-catalog";

import { allGames } from "@brainee/games";
import { expect, test } from "@playwright/test";

// Any Cyrillic letter (U+0400–U+04FF) means Russian copy slipped back in.
const CYRILLIC = /[\u0400-\u04FF]/;

test("the child and parent loop is English-only, even with a stale Russian locale cookie", async ({
  page,
  context,
  baseURL,
}, info) => {
  // Earlier builds stored a language choice; it must no longer switch anything.
  await context.addCookies([{ name: "brainee_locale", value: "ru", url: baseURL as string }]);
  const headers = { origin: baseURL as string };
  const join = await page.request.post("/api/jury", { headers });
  expect(join.ok()).toBe(true);
  const { credentials } = await join.json();
  await page.request.delete("/api/parent", { headers });
  await page.goto("/entry");
  await expect(page.getByRole("heading", { name: "What are we playing now?" })).toBeVisible();
  for (const path of ["learn", "leisure", "gifts", "brainy"]) {
    await page.goto(`/${path}`);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await page.locator("main").innerText()).not.toMatch(CYRILLIC);
  }
  await page.goto("/game/odd-one-out?seed=42");
  const shapes = page.getByRole("button", { name: /^Shape \d+$/ });
  await expect(shapes).toHaveCount(9);
  for (let round = 0; round < 4; round++) {
    const svg = await shapes
      .locator("svg")
      .evaluateAll((nodes) => nodes.map((node) => node.innerHTML));
    await shapes
      .nth(svg.findIndex((shape) => svg.filter((other) => other === shape).length === 1))
      .click();
    await page.getByRole("button", { name: round === 3 ? "Done" : "Next", exact: true }).click();
  }
  await expect(page.getByTestId("post-game")).toBeVisible();
  await expect(page.getByTestId("practice-game")).not.toContainText(CYRILLIC);
  const celebration = page.getByRole("dialog");
  await expect(celebration).toBeVisible();
  await celebration.getByRole("button", { name: "Awesome!" }).click();
  await page.goto("/analytics");
  for (const n of credentials.pin)
    await page.getByRole("button", { name: `Digit ${n}`, exact: true }).click();
  for (const path of ["analytics", "tasks", "settings"]) {
    await page.goto(`/${path}`);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await page.locator("main").innerText()).not.toMatch(CYRILLIC);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${path}-en.png`), fullPage: true });
  }
  for (const path of ["gifts", "tasks", "analytics"]) {
    await page.goto(`/${path}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
});

test("embedded games and Explore previews show English copy only", async ({ page }) => {
  const embedded = allGames.filter((game) => game.runtime === "embedded");
  for (const game of [...embedded, ...previews]) {
    const entry = "runtimeUrl" in game ? game.runtimeUrl : game.entry;
    await page.goto(`${entry}?level=1&seed=42`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // Canvas games (Picture Puzzle) have no body text; the check is that no Russian copy remains.
    await page.waitForLoadState("networkidle");
    expect(await page.title(), game.id).not.toMatch(CYRILLIC);
    expect(await page.locator("body").innerText(), game.id).not.toMatch(CYRILLIC);
  }
});
