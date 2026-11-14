import { expect, test } from "@playwright/test";

test("five child tabs, live hub, hero and Path preserve phone and iPad navigation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/learn");
  const tabs = page.getByRole("navigation", { name: "Sections" });
  await expect(tabs.getByRole("link")).toHaveCount(5);
  await expect(tabs.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByTestId("brainy-dock")).toBeVisible();
  await expect(page.getByTestId("wallet-stars")).toContainText(/\d+/);
  await page.screenshot({ path: info.outputPath("lavender-learn.png"), fullPage: true });
  for (const [name, path] of [
    ["Leisure", "leisure"],
    ["Gifts", "gifts"],
    ["Path", "path"],
  ]) {
    const link = tabs.getByRole("link", { name, exact: true });
    expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(56);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/${path}$`));
    await expect(link).toHaveAttribute("aria-current", "page");
  }
  await expect(page.getByRole("heading", { name: "Your growing world" })).toBeVisible();
  await expect(page.getByText("You are here", { exact: true })).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("lavender-path.png"), fullPage: true });
  await tabs.getByRole("link", { name: /^Brainy, energy/ }).click();
  await expect(page).toHaveURL(/\/brainy$/);
  await expect(page.getByTestId("brainy-dock")).toHaveCount(0);
  await expect(page.getByTestId("brainy-hero")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your discoveries" })).toHaveCount(0);
  await page.goto("/gifts");
  await page.getByRole("link", { name: "Open Brainy", exact: true }).click();
  await expect(page).toHaveURL(/\/brainy$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test("a game opens fullscreen from Learn and exits back", async ({ page }) => {
  await page.goto("/learn");
  await page.locator('a[href="/game/odd-one-out"]').click();
  await expect(page).toHaveURL(/\/game\/odd-one-out$/);
  await expect(page.getByRole("button", { name: /^Shape \d+$/ })).toHaveCount(9);
  await expect(page.getByRole("navigation", { name: "Sections" })).toHaveCount(0);
  await expect(page.getByTestId("brainy-dock")).toHaveCount(0);
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
});
test("unknown games cannot launch", async ({ page }) => {
  await page.goto("/game/not-a-game");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", "noindex");
  await expect(page.getByTestId("embedded-game")).toHaveCount(0);
});

test("the child shell links to PIN-gated parent mode and back", async ({ page, baseURL }) => {
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  await page.request.delete("/api/parent", { headers });
  await page.goto("/learn");
  await page.getByTestId("parent-entry").click();
  await expect(page).toHaveURL(/\/analytics$/);
  await expect(page.getByRole("heading", { name: "Parent login" })).toBeVisible();
  for (const digit of "1234") await page.getByRole("button", { name: `Digit ${digit}` }).click();
  await expect(page.getByRole("heading", { name: "Analytics", level: 1 })).toBeVisible();
});
