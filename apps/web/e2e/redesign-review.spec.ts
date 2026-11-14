import { expect, test } from "@playwright/test";

test("review lavender surfaces, compact summaries and accent roles", async ({
  page,
  context,
  baseURL,
}, info) => {
  await context.addCookies([{ name: "brainee_locale", value: "en", url: baseURL as string }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  expect((await page.request.post("/api/parent", { headers, data: { pin: "1234" } })).ok()).toBe(
    true,
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "entry",
    "learn",
    "leisure",
    "gifts",
    "brainy",
    "path",
    "explore",
    "game/odd-one-out",
    "analytics",
    "tasks",
    "rewards",
    "settings",
    "login",
  ]) {
    await page.goto(`/${route}`);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (["learn", "leisure", "gifts", "explore"].includes(route)) {
      const dock = page.getByTestId("brainy-dock");
      await expect(dock).toHaveAttribute("data-compact", "true");
      await expect(dock).toHaveCSS("background-color", "rgb(28, 27, 51)");
      await expect(dock).toContainText("Energy");
      await expect(dock).not.toContainText("+0");
      await expect(dock.getByRole("link", { name: /Weekly goal/ })).toBeVisible();
    }
    if (route === "leisure") {
      await page.getByText("Your play time", { exact: true }).click();
      await expect(page.getByTestId("leisure-time")).toContainText(
        "Pausing or leaving keeps the remaining time",
      );
    }
    if (route === "learn") {
      const first = page.getByTestId("recommended-game").first();
      expect((await first.boundingBox())?.y).toBeLessThan(
        (page.viewportSize()?.height ?? 844) - 100,
      );
      await expect(first).toHaveCSS("--highlight", "#ff9ec2");
    }
    if (route === "brainy") {
      await expect(page.getByTestId("brainy-hero")).toHaveAttribute("data-compact", "false");
    }
    if (route === "path")
      await expect(page.getByText("Earned ✓", { exact: true }).first()).toBeVisible();
    if (route.startsWith("game/")) {
      await expect(page.locator("[data-game]")).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "Round progress" })).toHaveCount(0);
    }
    if (["analytics", "tasks", "settings"].includes(route)) {
      const active = page
        .getByRole("navigation", { name: "Parent sections" })
        .locator('[aria-current="page"]:visible');
      await expect(active).toHaveCSS("color", "rgb(90, 63, 224)");
      expect((await active.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      route,
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`${route.replaceAll("/", "-")}.png`),
      fullPage: true,
      animations: "disabled",
    });
  }
  expect(errors).toEqual([]);
});
