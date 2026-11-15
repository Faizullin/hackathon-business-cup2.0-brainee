import { playExplore } from "../../apps/web/e2e/explore-acceptance";
import { expect, launch, test, unscored } from "../../apps/web/e2e-games/fixture";

test("magnet-explorer: real exploration", async ({ page }) => {
  const frame = await launch(page, "magnet-explorer", false);
  await playExplore(page, "magnet-explorer", frame);
  await expect(frame.locator("[data-result]")).toBeVisible();
  await unscored(page);
});
