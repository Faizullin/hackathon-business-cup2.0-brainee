import { expect, test } from "@playwright/test";

test.describe("neighborhood-map-walk: unscored exploration preview", () => {
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

    await page.goto("/games/neighborhood-map-walk/index.html");

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

    // 3. Splash screen and start button
    const startBtn = page.locator('[data-target="start"]');
    await expect(startBtn).toBeVisible();

    // 4. Creative editor flow: Draw Home step
    await startBtn.click();
    const houseCanvas = page.locator("#house-canvas");
    await expect(houseCanvas).toBeVisible();

    // Draw a stroke on the house drawing canvas
    const canvasBox = await houseCanvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    if (canvasBox) {
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 180, canvasBox.y + 120, { steps: 5 });
      await page.mouse.move(canvasBox.x + 150, canvasBox.y + 180, { steps: 5 });
      await page.mouse.up();
    }

    // Complete house drawing
    const houseDoneBtn = page.locator('[data-target="house-done"]');
    await expect(houseDoneBtn).toBeEnabled();
    await houseDoneBtn.click();

    // Magic house transition
    const magicNextBtn = page.locator('[data-target="magic-next"]');
    await expect(magicNextBtn).toBeVisible();

    await page.evaluate(() => {
      const btn = document.querySelector('[data-target="magic-next"]');
      if (btn) {
        btn.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            isPrimary: true,
            pointerId: 1,
          }),
        );
        btn.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            cancelable: true,
            isPrimary: true,
            pointerId: 1,
          }),
        );
      }
    });

    // 5. Wind a Road step
    await expect(page.locator(".paper-prompt h1")).toContainText("Draw a road");
    const roadCanvas = page.locator("#road-canvas");
    await expect(roadCanvas).toBeVisible();

    const roadBox = await roadCanvas.boundingBox();
    expect(roadBox).not.toBeNull();

    if (roadBox) {
      await page.mouse.move(roadBox.x + 80, roadBox.y + 80);
      await page.mouse.down();
      await page.mouse.move(roadBox.x + 200, roadBox.y + 150, { steps: 5 });
      await page.mouse.up();
    }

    const roadDoneBtn = page.locator('[data-target="road-done"]');
    await expect(roadDoneBtn).toBeEnabled();
    await page.evaluate(() => {
      const btn = document.querySelector('[data-target="road-done"]');
      if (btn) {
        btn.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            isPrimary: true,
            pointerId: 1,
          }),
        );
        btn.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            cancelable: true,
            isPrimary: true,
            pointerId: 1,
          }),
        );
      }
    });

    // 6. Community Places / Living Neighborhood
    await expect(page.locator(".paper-prompt h1")).toContainText("Fill your neighborhood");
    await expect(page.locator(".place-tray")).toBeVisible();
    const treeBtn = page.locator('.place-choice[data-place="tree"]');
    await expect(treeBtn).toBeVisible();
    await treeBtn.click();
    await expect(treeBtn).toHaveClass(/is-selected/);

    // 7. Host exit button click
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

    // 8. Verification: zero console errors, zero foreign requests, zero scoring events
    expect(consoleErrors).toEqual([]);
    expect(foreignRequests).toEqual([]);
    expect(scoringRequests).toEqual([]);
  });
});
