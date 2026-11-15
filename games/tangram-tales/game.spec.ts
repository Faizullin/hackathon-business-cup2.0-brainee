import { completeTangram } from "../../apps/web/e2e/tangram";
import { finished, launch, test } from "../../apps/web/e2e-games/fixture";

test("tangram-tales: seeded real-input session", async ({ page }) => {
  await page.clock.install();
  await launch(page, "tangram-tales");
  for (let round = 0; round < 4; round++) {
    await completeTangram(page, () => page.clock.runFor(1000));
  }
  await finished(page, "tangram-tales");
});
