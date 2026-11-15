import { placePuzzlePiece } from "../../apps/web/e2e/picture-puzzle";
import { finished, launch, test } from "../../apps/web/e2e-games/fixture";

test("picture-puzzle: seeded real-input session", async ({ page }) => {
  await launch(page, "picture-puzzle");
  for (let round = 0; round < 4; round++) {
    await placePuzzlePiece(page);
  }
  await finished(page, "picture-puzzle");
});
