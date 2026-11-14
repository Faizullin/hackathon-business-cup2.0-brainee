import { expect, test } from "@playwright/test";
import { finishOddOneOut } from "./play-game";

test("lavender host frame and round progress keep saved game behavior", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/game/odd-one-out?seed=42");
  const frame = page.getByTestId("game-host-frame");
  await expect(frame).toBeVisible();
  await expect(frame.locator("[data-game]")).toBeVisible();
  await expect(frame).toHaveCSS("border-radius", "28px");
  await expect(page.getByRole("progressbar", { name: "Round progress" })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("game-host.png"), fullPage: true });
  await finishOddOneOut(page);
  await expect(page.getByTestId("post-game")).toBeVisible();
});
