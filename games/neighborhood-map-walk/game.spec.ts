import { playExplore } from "../../apps/web/e2e/explore-acceptance";
import { expect, launch, test, unscored } from "../../apps/web/e2e-games/fixture";

test("neighborhood-map-walk: real exploration", async ({ page }) => {
  const frame = await launch(page, "neighborhood-map-walk", false);
  await playExplore(page, "neighborhood-map-walk", frame);
  await expect(frame.locator("#road-canvas")).toBeVisible();
  await unscored(page);
});
