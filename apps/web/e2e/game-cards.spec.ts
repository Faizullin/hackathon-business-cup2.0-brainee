import { expect, type Page, test } from "@playwright/test";
import { newFamily } from "./new-family";

/** Every visible card image is a loaded same-origin thumbnail, not just a skill icon. */
async function expectThumbnails(page: Page, minimum: number) {
  const images = page.getByTestId("game-thumbnail");
  await expect.poll(() => images.count()).toBeGreaterThanOrEqual(minimum);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBeGreaterThan(0);
    const src = await image.getAttribute("src");
    expect(src).toMatch(/^\/games\/[a-z0-9-]+\/thumbnail\.svg$/);
    const box = await image.boundingBox();
    // 4:3 and large enough to recognize the mechanic (≥ 96 px wide on phone and iPad).
    expect(box?.width).toBeGreaterThanOrEqual(96);
    expect(Math.abs((box?.width ?? 0) / (box?.height ?? 1) - 4 / 3)).toBeLessThan(0.05);
  }
}

test("Learn, Entry and Explore cards render game thumbnails; locked ones are dimmed", async ({
  page,
  baseURL,
}, info) => {
  // A four-year-old sees open and age-locked games side by side.
  await newFamily(page.request, baseURL as string, 4);
  await page.goto("/learn");
  await expectThumbnails(page, 7);
  const locked = page.locator('[aria-disabled="true"] [data-testid="game-thumbnail"]');
  await expect.poll(() => locked.count()).toBeGreaterThan(0);
  await expect(locked.first()).toHaveCSS("opacity", "0.5");
  await page.screenshot({ path: info.outputPath("learn-cards.png"), fullPage: true });

  await page.goto("/entry");
  await expect(page.getByTestId("recommended-game").first()).toBeVisible();
  await expectThumbnails(page, 1);
  await page.screenshot({ path: info.outputPath("entry-cards.png"), fullPage: true });

  await page.goto("/explore");
  await expectThumbnails(page, 5);
  await page.screenshot({ path: info.outputPath("explore-cards.png"), fullPage: true });
});

test("failed thumbnail requests keep the card geometry and a usable title", async ({ page }) => {
  await page.route("**/games/*/thumbnail.svg", (route) => route.abort());
  await page.goto("/learn");
  const card = page.locator('a[href="/game/odd-one-out"]').first();
  await expect(card).toContainText("Odd One Out");
  await card.scrollIntoViewIfNeeded();
  const fallback = card.getByTestId("game-thumbnail-fallback");
  await expect(fallback).toBeVisible();
  const before = await fallback.boundingBox();
  expect(Math.abs((before?.width ?? 0) / (before?.height ?? 1) - 4 / 3)).toBeLessThan(0.05);
  await page.unroute("**/games/*/thumbnail.svg");
  await page.reload();
  const image = card.getByTestId("game-thumbnail");
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const after = await image.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
  await expect(image).toHaveCSS("object-fit", "cover");
});
