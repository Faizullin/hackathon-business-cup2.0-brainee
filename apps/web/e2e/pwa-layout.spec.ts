import { expect, test } from "@playwright/test";

test("installable: manifest and generated icons come from our origin", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "Brainy",
    lang: "en",
    display: "standalone",
    start_url: "/",
  });
  for (const icon of manifest.icons as { src: string }[]) {
    expect(icon.src.startsWith("/")).toBe(true);
    const response = await request.get(icon.src);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
});

test("iPad landscape uses a side rail; portrait tablets get a rotate hint", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto("/learn");
  const rail = page.getByRole("navigation", { name: "Sections" });
  await expect(rail).toBeVisible();
  const box = await rail.boundingBox();
  expect(box?.x).toBe(0);
  expect(box?.height).toBe(820);
  await expect(page.getByTestId("rotate-hint")).toBeHidden();
  await page.setViewportSize({ width: 820, height: 1180 });
  await expect(page.getByTestId("rotate-hint")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("rotate-hint")).toBeHidden();
});
