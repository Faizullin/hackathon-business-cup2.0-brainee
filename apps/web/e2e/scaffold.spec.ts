import { expect, test } from "@playwright/test";

for (const route of [
  { path: "/learn", destination: "/learn", heading: "Learn" },
  { path: "/analytics", destination: "/analytics", heading: "Parent login" },
  { path: "/login", destination: "/login", heading: "Welcome to Brainy" },
]) {
  test(`${route.path} renders its shell using only same-origin resources`, async ({
    page,
    baseURL,
    browserName,
  }, testInfo) => {
    const errors: string[] = [];
    const foreignRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== baseURL) foreignRequests.push(request.url());
    });

    const response = await page.goto(route.path);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(`${baseURL}${route.destination}`);
    await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(242, 241, 250)");
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        body: getComputedStyle(document.body).fontFamily,
        heading: getComputedStyle(document.querySelector("h1") as HTMLElement).fontFamily,
        manropeLoaded: Array.from(document.fonts).some(
          (font) => font.status === "loaded" && font.family.toLowerCase().includes("manrope"),
        ),
      };
    });
    expect(fonts.body.toLowerCase()).toContain("manrope");
    expect(fonts.heading.toLowerCase()).toContain("manrope");
    expect(fonts.manropeLoaded).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    if (route.path === "/learn") {
      await page.screenshot({ path: testInfo.outputPath("learn.png"), fullPage: true });
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(page.locator("body")).toHaveCSS("background-color", "rgb(20, 18, 38)");
    }

    if (route.path === "/login") {
      const link = page.getByRole("link", { name: "To Learning" });
      await expect(link).toHaveCSS("min-height", "56px");
      await expect(link).toHaveCSS("transition-duration", "0.2s");
      // Safari on macOS uses Option-Tab to include links in keyboard traversal.
      const nextLinkKey =
        browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
      await page.keyboard.press(nextLinkKey);
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
      for (
        let i = 0;
        i < 8 && !(await link.evaluate((node) => node === document.activeElement));
        i++
      )
        await page.keyboard.press(nextLinkKey);
      await expect(link).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(`${baseURL}/learn`);
      await expect(page.getByRole("heading", { name: "Learn", level: 1 })).toBeVisible();
    }

    expect(errors).toEqual([]);
    expect(foreignRequests).toEqual([]);
  });
}

test("reduced motion disables feedback transitions and keeps navigation working", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  const link = page.getByRole("link", { name: "To Learning" });
  await expect(link).toHaveCSS("transition-duration", "0s");
  await link.click();
  await expect(page.getByRole("heading", { name: "Learn", level: 1 })).toBeVisible();
});

test("unknown routes return an English 404 with a way back", async ({ page }) => {
  const response = await page.goto("/missing-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "To Learning" }).click();
  await expect(page.getByRole("heading", { name: "Learn", level: 1 })).toBeVisible();
});
