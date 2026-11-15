import {
  getSecretMessagePattern,
  playSecretMessageInput,
} from "../../apps/web/e2e/secret-message-copy";
import { finished, launch, test } from "../../apps/web/e2e-games/fixture";

test("secret-message-copy: seeded real-input session", async ({ page }) => {
  await page.clock.install();
  const frame = await launch(page, "secret-message-copy");
  for (let round = 0; round < 4; round++) {
    await page.clock.runFor(8500);
    await playSecretMessageInput(frame, getSecretMessagePattern(1, round), false, round, () =>
      page.clock.runFor(200),
    );
  }
  await finished(page, "secret-message-copy");
});
