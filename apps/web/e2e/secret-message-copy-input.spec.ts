import { expect, test } from "@playwright/test";
import { launchLab } from "./imported-games";
import { getSecretMessagePattern } from "./secret-message-copy";

// Touch-first input checks: real taps through the touch pipeline, no forced or synthetic events.
test.use({ hasTouch: true });

test("secret-message-copy: touch stamps, slot removal and a double-tapped Check count once", async ({
  page,
}) => {
  await launchLab(page, "secret-message-copy", 1);
  const frame = page.getByTestId("embedded-game").contentFrame();
  const game = frame.locator("#game");
  const filled = frame.locator(".copy-slot.is-filled");
  const check = frame.locator('[data-action="check"]');
  const pattern = getSecretMessagePattern(1, 0);

  await expect(game).toHaveAttribute("data-turn", "preview");
  await check.tap();
  await expect(game).toHaveAttribute("data-turn", "recall");

  // Fill two, remove the second by tapping its slot, then fill the whole message.
  for (const sym of pattern.slice(0, 2))
    await frame.locator(`.stamp-button[data-symbol="${sym}"]`).tap();
  await expect(filled).toHaveCount(2);
  await frame.locator('.copy-slot[data-index="1"]').tap();
  await expect(filled).toHaveCount(1);
  for (const [i, sym] of pattern.slice(1).entries()) {
    await frame.locator(`.stamp-button[data-symbol="${sym}"]`).tap();
    await expect(filled).toHaveCount(i + 2);
  }
  // Extra taps past the end are ignored.
  await frame.locator('.stamp-button[data-symbol="star"]').tap();
  await expect(filled).toHaveCount(pattern.length);

  await check.tap();
  await check.tap();
  await expect(frame.locator(".session-progress")).toHaveText("Послание 2 из 4");
  const stream = page.getByTestId("event-stream");
  await expect(stream.locator('[data-event="round"]')).toHaveCount(1);
  await expect(stream.locator('[data-event="round"]')).toContainText(
    "correct=true afterMistake=false",
  );
  await expect(game).toHaveAttribute("data-turn", "preview");
});
