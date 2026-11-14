import { expect, test } from "@playwright/test";
import { newFamily } from "./new-family";
import { finishOddOneOut } from "./play-game";
import { savedState } from "./saved-state";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`reward motion respects ${reducedMotion} and leaves saved amounts unchanged`, async ({
    page,
    baseURL,
  }, info) => {
    await page.emulateMedia({ reducedMotion });
    await newFamily(page.request, baseURL as string);
    const before = await savedState(page.request);
    await page.goto("/game/odd-one-out?seed=42");
    await page.evaluate(() => {
      document.documentElement.dataset.rewardSeen = "false";
      new MutationObserver(() => {
        if (document.querySelector('[data-testid="reward-flight"]'))
          document.documentElement.dataset.rewardSeen = "true";
      }).observe(document.body, { childList: true, subtree: true });
    });
    await finishOddOneOut(page);
    await expect(page.locator("html")).toHaveAttribute(
      "data-reward-seen",
      String(reducedMotion === "no-preference"),
    );
    await expect(page.getByTestId("reward-flight")).toHaveCount(0);
    expect((await savedState(page.request)).progress.wallet.stars).toBe(
      before.progress.wallet.stars + 12,
    );
    await page.screenshot({ path: info.outputPath(`reward-${reducedMotion}.png`), fullPage: true });
    await page.getByRole("button", { name: "Enough for today" }).click();
    await expect(page).toHaveURL(/\/brainy$/);
    await page.goto("/learn");
    await expect(page.getByTestId("wallet-stars")).toContainText(
      String(before.progress.wallet.stars + 12),
    );
    if (reducedMotion === "reduce")
      await expect(page.locator(".brainy-idle").first()).toHaveCSS("animation-name", "none");
  });
}

test("going offline preserves confirmed data and recovers with a friendly retry", async ({
  page,
  context,
}, info) => {
  await page.goto("/learn");
  await expect(page.getByTestId("wallet-stars")).toBeVisible();
  const balance = (await page.getByTestId("wallet-stars").textContent()) ?? "";
  await context.setOffline(true);
  const notice = page.getByRole("alert").filter({ hasText: "You're offline" });
  await expect(notice).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("wallet-stars")).toHaveText(balance);
  await page.screenshot({ path: info.outputPath("offline.png"), fullPage: true });
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await context.setOffline(false);
  await expect(notice).toHaveCount(0);
});
