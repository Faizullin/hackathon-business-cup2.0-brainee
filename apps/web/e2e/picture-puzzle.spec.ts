import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { placePuzzlePiece } from "./picture-puzzle";
import { savedState } from "./saved-state";

test("puzzle rejection, correction and four placements save exactly one reward", async ({
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
  await page.goto("/game/picture-puzzle?level=3&seed=42");
  await expect(page.getByTestId("embedded-game")).toHaveAttribute("data-ready", "true", {
    timeout: 10000,
  });
  await page.screenshot({ path: info.outputPath("puzzle-play.png"), fullPage: true });
  await placePuzzlePiece(page, true);
  await page.screenshot({ path: info.outputPath("puzzle-rejected.png"), fullPage: true });
  for (let round = 0; round < 4; round++) await placePuzzlePiece(page);
  await expect(page.getByTestId("post-game")).toBeVisible();
  await expect(page.getByTestId("earned-stars")).toContainText("+13");
  expect(finishes).toHaveLength(1);
  const after = await savedState(page.request);
  expect(after.progress.wallet.stars).toBe(before.progress.wallet.stars + 13);
  const replay = await page.request.post("/api/sessions", {
    headers: { origin: baseURL as string },
    data: finishes[0],
  });
  expect(replay.ok()).toBe(true);
  expect((await savedState(page.request)).progress.wallet.stars).toBe(after.progress.wallet.stars);
});

test("leaving an unfinished puzzle stops without a reward", async ({ page, baseURL }) => {
  await newFamily(page.request, baseURL as string);
  const before = await savedState(page.request);
  let finishes = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/sessions") finishes++;
  });
  await page.goto("/game/picture-puzzle?level=3&seed=42");
  await placePuzzlePiece(page);
  await page.getByRole("button", { name: /Exit/ }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByTestId("embedded-game")).toHaveCount(0);
  expect(finishes).toBe(0);
  expect((await savedState(page.request)).progress.wallet.stars).toBe(before.progress.wallet.stars);
});

test("missing embedded ready becomes an error and removes the iframe", async ({ page }) => {
  await page.route("**/games/picture-puzzle/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Silent game</title>" }),
  );
  await page.goto("/lab");
  await page.getByRole("combobox", { name: "Game", exact: true }).selectOption("picture-puzzle");
  await expect(page.getByTestId("event-stream")).toHaveAttribute("data-status", "error", {
    timeout: 12000,
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "The game could not load" }),
  ).toBeVisible();
  await expect(page.getByTestId("embedded-game")).toHaveCount(0);
});

test("level one keeps its issued level across four pictures", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  await page.getByRole("combobox", { name: "Game", exact: true }).selectOption("picture-puzzle");
  for (let round = 0; round < 4; round++) await placePuzzlePiece(page);
  const stream = page.getByTestId("event-stream");
  await expect(stream).toHaveAttribute("data-status", "finished");
  await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
  await expect(stream.locator('[data-event="finish"]')).toContainText('"level":1,"rounds":4');
});
