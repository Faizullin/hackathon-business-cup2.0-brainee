import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { savedState } from "./saved-state";

// Prepare the standalone GSP sample using the author-guide commands before this isolated spec.
test("remote Phaser game handshakes in an opaque sandbox at Lab and Explore without foreign requests or rewards", async ({
  page,
  request,
  baseURL,
}) => {
  const foreign: string[] = [];
  const sessions: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).origin !== baseURL) foreign.push(r.url());
    if (/\/api\/sessions/.test(r.url())) sessions.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const catalog = await (await request.get("/api/games")).json();
  const game = catalog.previews.find((g: { id: string }) => g.id === "phaser-shape-match");
  test.skip(!game, "Publish the standalone remote Phaser sample first (docs/dev/games.md)");
  const asset = await request.get(game.entry);
  expect(asset.headers()["cache-control"]).toContain("immutable");
  expect(asset.headers()["content-security-policy"]).toContain("sandbox allow-scripts;");
  await page.goto("/lab");
  await page.getByRole("combobox", { name: "Game", exact: true }).selectOption(game.id);
  const iframe = page.getByTestId("explore-frame");
  await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
  await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 15000 });
  const frame = page.frames().find((f) => f.url().includes("/g/"));
  expect(frame).toBeTruthy();
  expect(
    await frame?.evaluate(() => {
      try {
        localStorage.getItem("probe");
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  expect(
    await frame?.evaluate(() => {
      try {
        return parent.document !== undefined;
      } catch {
        return false;
      }
    }),
  ).toBe(false);
  await expect(page.frameLocator('[data-testid="explore-frame"]').locator("canvas")).toBeVisible();
  await page.screenshot({ path: "test-results/remote-game-lab-ipad.png" });
  await newFamily(page.request, baseURL as string);
  const before = await savedState(page.request);
  await page.goto("/explore");
  await page.getByRole("link", { name: new RegExp(game.title.replace(/[()]/g, "\\$&")) }).click();
  await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 15000 });
  await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
  const canvas = page.frameLocator('[data-testid="explore-frame"]').locator("canvas");
  await expect(canvas).toBeVisible();
  // Read-only scene coordinates; real pointer input performs the match.
  const gameFrame = page.frames().find((f) => f.url().includes("/g/"));
  if (!gameFrame) throw new Error("Missing remote frame");
  const points = await gameFrame.evaluate(() => {
    const scene = (
      window as unknown as {
        __PHASER_GAME__: {
          scene: {
            getScene(key: string): {
              shapeButtons: { x: number; y: number }[];
              slotGraphics: { x: number; y: number }[];
            };
          };
        };
      }
    ).__PHASER_GAME__.scene.getScene("ShapeMatchScene");
    const button = scene.shapeButtons[0];
    const slot = scene.slotGraphics[0];
    if (!button || !slot) throw new Error("Scene not ready");
    return { button: { x: button.x, y: button.y }, slot: { x: slot.x, y: slot.y } };
  });
  await canvas.click({ position: points.button });
  await canvas.click({ position: points.slot });
  await expect
    .poll(() =>
      gameFrame.evaluate(
        () =>
          (
            window as unknown as {
              __PHASER_GAME__: { scene: { getScene(key: string): { matchedCount: number } } };
            }
          ).__PHASER_GAME__.scene.getScene("ShapeMatchScene").matchedCount,
      ),
    )
    .toBe(1);
  await page.screenshot({ path: "test-results/remote-game-explore-ipad.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toBeVisible();
  await page.screenshot({ path: "test-results/remote-game-explore-phone.png" });
  await page.getByRole("link", { name: "← Exit" }).click();
  const after = await savedState(page.request);
  expect(after.progress.wallet).toEqual(before.progress.wallet);
  expect(after.progress.skills).toEqual(before.progress.skills);
  expect(sessions).toEqual([]);
  expect(foreign).toEqual([]);
  expect(errors).toEqual([]);
});
