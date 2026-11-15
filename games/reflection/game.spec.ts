import { solveReflectionPattern } from "../../apps/web/e2e/reflection";
import { finished, launch, test } from "../../apps/web/e2e-games/fixture";

test("reflection: seeded real-input session", async ({ page }) => {
  const frame = await launch(page, "reflection");
  for (let round = 0; round < 4; round++) {
    await solveReflectionPattern(page, frame);
  }
  await finished(page, "reflection");
});
