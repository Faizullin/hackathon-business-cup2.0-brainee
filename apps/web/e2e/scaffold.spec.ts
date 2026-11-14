import { expect, test } from "@playwright/test";

for (const route of [
  { path: "/", destination: "/learn", heading: "Учимся" },
  { path: "/analytics", destination: "/analytics", heading: "Аналитика" },
  { path: "/login", destination: "/login", heading: "Добро пожаловать в Брейни" },
]) {
  test(`${route.path} renders its shell using only same-origin resources`, async ({
    page,
    baseURL,
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
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(241, 244, 250)");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    if (route.path === "/") {
      await page.screenshot({ path: testInfo.outputPath("learn.png"), fullPage: true });
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(page.locator("body")).toHaveCSS("background-color", "rgb(16, 18, 28)");
    }

    if (route.path === "/login") {
      await page.getByRole("link", { name: "К занятиям" }).click();
      await expect(page).toHaveURL(`${baseURL}/learn`);
      await expect(page.getByRole("heading", { name: "Учимся", level: 1 })).toBeVisible();
    }

    expect(errors).toEqual([]);
    expect(foreignRequests).toEqual([]);
  });
}

test("unknown routes return a Russian 404 with a way back", async ({ page }) => {
  const response = await page.goto("/missing-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  await page.getByRole("link", { name: "К занятиям" }).click();
  await expect(page.getByRole("heading", { name: "Учимся", level: 1 })).toBeVisible();
});
