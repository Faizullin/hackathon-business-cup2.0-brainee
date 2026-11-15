import { expect, test } from "@playwright/test";
import { launchLab } from "./imported-games";
import { getRhythmPattern } from "./rhythm-copycat";

// Touch-first input checks: real taps through the touch pipeline, no forced or synthetic events.
test.use({ hasTouch: true });

test("rhythm-copycat: fast consecutive touch taps register once each", async ({ page }) => {
  test.setTimeout(90000);
  await launchLab(page, "rhythm-copycat", 3);
  const frame = page.getByTestId("embedded-game").contentFrame();
  for (let round = 0; round < 4; round++) {
    const pattern = getRhythmPattern(3, round);
    await expect(frame.locator("#game")).toHaveAttribute("data-turn", "player", {
      timeout: 10000,
    });
    for (const [i, action] of pattern.entries()) {
      await frame.locator(`.rc-pad[data-pad="${action}"]`).tap();
      if (i < pattern.length - 1)
        await expect(frame.locator(".rc-chip.is-shown")).toHaveCount(i + 1);
    }
  }
  const stream = page.getByTestId("event-stream");
  await expect(stream).toHaveAttribute("data-status", "finished");
  await expect(stream.locator('[data-event="finish"]')).toHaveCount(1);
  await expect(stream.locator('[data-event="finish"]')).toContainText(
    '"level":3,"rounds":4,"mistakes":0,"corrections":0',
  );
});

test("rhythm-copycat: taps during the demo are ignored and never count", async ({ page }) => {
  await launchLab(page, "rhythm-copycat", 1);
  const frame = page.getByTestId("embedded-game").contentFrame();
  const pattern = getRhythmPattern(1, 0);
  // Replay the demo, then tap while it plays.
  await expect(frame.locator("#game")).toHaveAttribute("data-turn", "player", {
    timeout: 10000,
  });
  await frame.locator('[data-action="listen"]').tap();
  await expect(frame.locator("#game")).toHaveAttribute("data-turn", "demo");
  for (const action of ["clap", "stomp", "tap"])
    await frame.locator(`.rc-pad[data-pad="${action}"]`).tap();
  await expect(frame.locator("#game")).toHaveAttribute("data-turn", "player", {
    timeout: 10000,
  });
  await expect(frame.locator(".rc-chip.is-shown")).toHaveCount(0);
  for (const action of pattern) await frame.locator(`.rc-pad[data-pad="${action}"]`).tap();
  await expect(frame.locator(".session-progress")).toHaveText(/2/);
  const stream = page.getByTestId("event-stream");
  await expect(stream.locator('[data-event="round"]')).toHaveCount(1);
  await expect(stream.locator('[data-event="round"]')).toContainText(
    "correct=true afterMistake=false",
  );
});
