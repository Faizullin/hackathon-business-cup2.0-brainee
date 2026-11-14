import { expect, test } from "@playwright/test";

test.describe("magnet-explorer: unscored exploration preview", () => {
  test("loads offline on same origin, shows host chrome 'Свободная игра · без звёзд', and has no console errors", async ({
    page,
    baseURL,
  }) => {
    const consoleErrors: string[] = [];
    const foreignRequests: string[] = [];
    const scoringRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.origin !== baseURL) {
        foreignRequests.push(req.url());
      }
      if (url.pathname.includes("/api/sessions") || url.pathname.includes("score")) {
        scoringRequests.push(req.url());
      }
    });

    await page.goto("/games/magnet-explorer/index.html");

    // 1. Host bar and unscored exploration badge
    const hostBar = page.getByTestId("host-bar");
    await expect(hostBar).toBeVisible();

    const hostBadge = page.getByTestId("host-badge");
    await expect(hostBadge).toHaveText("Свободная игра · без звёзд");

    const exitBtn = page.getByTestId("host-exit-button");
    await expect(exitBtn).toBeVisible();
    await expect(exitBtn).toContainText("Выход");

    // Touch target >= 48px
    const exitBox = await exitBtn.boundingBox();
    expect(exitBox).not.toBeNull();
    if (exitBox) {
      expect(exitBox.width).toBeGreaterThanOrEqual(48);
      expect(exitBox.height).toBeGreaterThanOrEqual(48);
    }

    // 2. Microphone access is guarded / disabled
    const micBlocked = await page.evaluate(async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return false;
      } catch {
        return true;
      }
    });
    expect(micBlocked).toBe(true);

    // 3. Splash screen and mode cards
    const testModeBtn = page.locator('[data-mode="test-lab"]');
    const sweepModeBtn = page.locator('[data-mode="treasure-sweep"]');
    const mazeModeBtn = page.locator('[data-mode="magnet-maze"]');

    await expect(testModeBtn).toBeVisible();
    await expect(sweepModeBtn).toBeVisible();
    await expect(mazeModeBtn).toBeVisible();

    // 4. Test Station (test-lab) mode interaction
    await testModeBtn.click();
    await expect(page.locator(".play-screen")).toBeVisible();
    await expect(page.locator(".test-pedestal")).toBeVisible();
    await expect(page.locator(".magnet-tool")).toBeVisible();

    // Drag magnet to test-object
    const magnet = page.locator(".magnet-tool");
    const target = page.locator(".test-object");
    await expect(target).toBeVisible();

    const targetBox = await target.boundingBox();
    expect(targetBox).not.toBeNull();

    if (targetBox) {
      await magnet.hover();
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
        steps: 8,
      });
      await page.mouse.up();
    }

    // 5. Host exit button click
    await page.exposeFunction("onHostExitFired", () => {});
    await page.evaluate(() => {
      window.addEventListener("message", (e) => {
        if (e.data && (e.data.type === "session.exit" || e.data.type === "brainee:exit")) {
          // @ts-expect-error exposed function
          window.onHostExitFired();
        }
      });
    });

    await exitBtn.click();
    await page.waitForTimeout(100);

    // 6. Verification: zero errors, zero foreign requests, zero scoring events
    expect(consoleErrors).toEqual([]);
    expect(foreignRequests).toEqual([]);
    expect(scoringRequests).toEqual([]);
  });
});
