import { completeTangram } from "../../apps/web/e2e/tangram";
import { expect, finished, test } from "../../apps/web/e2e-games/fixture";

test("tangram-tales: ready after assets, then immediate real-input session", async ({ page }) => {
  await page.clock.install();
  // Hold a real preload dependency, rather than guessing how long startup takes.
  let releaseAsset = () => {};
  const assetGate = new Promise<void>((resolve) => {
    releaseAsset = resolve;
  });
  await page.route("**/tangram-tales/assets/pieces/large-a.webp", async (route) => {
    await assetGate;
    await route.continue();
  });
  await page.goto("/?id=tangram-tales", { waitUntil: "domcontentloaded" });
  const iframe = page.getByTestId("embedded-game");
  const game = iframe.contentFrame().locator("#game");
  try {
    await expect(game).toHaveAttribute("data-turn", "loading");
    await expect(game).toHaveAttribute("aria-busy", "true");
    await expect(game.getByRole("status")).toHaveText("Getting the puzzle ready…");
    await expect(game.locator(".tray-piece")).toHaveCount(0);
    await expect(iframe).toHaveAttribute("data-ready", "false");
  } finally {
    releaseAsset();
  }
  await expect(iframe).toHaveAttribute("data-ready", "true");
  // No settling sleeps or clock jumps before inputs: readiness must mean tappable.
  for (let round = 0; round < 4; round++) {
    await completeTangram(page, () => page.clock.runFor(700));
  }
  await finished(page, "tangram-tales");
});
