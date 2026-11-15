import { GAMES, view } from "../../apps/web/e2e/phaser-preview";
import { expect, launch, test, unscored } from "../../apps/web/e2e-games/fixture";

test("shape-pairs: real exploration", async ({ page }) => {
  const frame = await launch(page, "shape-pairs", false);
  const game = GAMES.find((g) => g.id === "shape-pairs");
  if (!game) throw new Error("Missing interaction helper");
  await expect.poll(async () => (await view(page, game.scene)).ready).toBe(true);
  await frame.locator("#start-game").click();
  await expect.poll(async () => (await view(page, game.scene)).menuOpen).toBe(false);
  await game.play(page);
  await unscored(page);
});
