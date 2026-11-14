import { expect, test } from "@playwright/test";

test.describe("Bilingual localization & locale switching", () => {
  test("defaults to English on home page, allows switching to Russian and persists", async ({
    page,
    context,
  }) => {
    // Clear cookies to test default locale
    await context.clearCookies();

    // 1. Home page in English by default
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Welcome to Brainy", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "I am a Parent" })).toBeVisible();
    await expect(page.getByRole("link", { name: "This is the child's device" })).toBeVisible();

    // 2. Click Russian in floating pill
    await page.getByRole("button", { name: "🇷🇺 RU" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(
      page.getByRole("heading", { name: "Добро пожаловать в Брейни", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Я родитель" })).toBeVisible();

    // Verify cookie persisted
    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "brainee_locale");
    expect(localeCookie?.value).toBe("ru");

    // 3. Reload page - should remain Russian (SSR)
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(
      page.getByRole("heading", { name: "Добро пожаловать в Брейни", level: 1 }),
    ).toBeVisible();

    // 4. Switch back to English
    await page.getByRole("button", { name: "🇬🇧 EN" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Welcome to Brainy", level: 1 })).toBeVisible();
  });
});
