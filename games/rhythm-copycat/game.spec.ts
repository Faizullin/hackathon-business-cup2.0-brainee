import { getRhythmPattern, playRhythmInput } from "../../apps/web/e2e/rhythm-copycat";
import { finished, launch, test } from "../../apps/web/e2e-games/fixture";

test("rhythm-copycat: seeded real-input session", async ({ page }) => {
  await page.clock.install();
  const frame = await launch(page, "rhythm-copycat");
  for (let round = 0; round < 4; round++) {
    await page.clock.runFor(6500);
    await playRhythmInput(frame, getRhythmPattern(1, round), false, round);
  }
  await finished(page, "rhythm-copycat");
});
