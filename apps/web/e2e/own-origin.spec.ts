import { expect, test } from "@playwright/test";

test("every route and its resources stay on our origin", async ({ page, context, baseURL }) => {
  const foreign: string[] = [];
  context.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== baseURL) foreign.push(request.url());
  });
  const headers = { origin: baseURL as string };
  await page.request.post("/api/demo-session", { headers });
  expect((await page.request.post("/api/parent", { headers, data: { pin: "1234" } })).ok()).toBe(
    true,
  );
  for (const path of [
    "/",
    "/entry",
    "/learn",
    "/leisure",
    "/gifts",
    "/brainy",
    "/analytics",
    "/tasks",
    "/rewards",
    "/settings",
    "/child-login",
    "/onboarding",
    "/signup",
    "/onboarding/setup",
    "/fun/snake",
    "/login",
    "/game/odd-one-out",
    "/game/continue-pattern",
    "/lab",
    "/lab/brainy",
    "/not-found",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (path.startsWith("/game/")) await expect(page.locator("[data-game]")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      path,
    ).toBe(true);
  }
  for (const path of ["/manifest.webmanifest", "/icon", "/apple-icon"]) {
    expect((await page.request.get(path)).ok()).toBe(true);
  }
  expect(foreign).toEqual([]);
});
