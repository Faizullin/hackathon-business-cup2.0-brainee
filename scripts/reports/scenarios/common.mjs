import assert from "node:assert/strict";

/** Shared surface checks for each screen in the continuous walkthrough. */
export async function checkSurface(page, { timeline }) {
  const surface = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      language: document.documentElement.lang,
      fits: document.documentElement.scrollWidth <= window.innerWidth,
      loadedFonts: Array.from(document.fonts).filter((font) => font.status === "loaded").length,
    };
  });
  for (const [ok, message] of [
    [surface.language === "en", "The document language is English"],
    [surface.fits, "The screen fits without horizontal scrolling"],
    [surface.loadedFonts >= 2, "The two self-hosted font families load"],
  ]) {
    timeline?.check(ok, message);
    assert.ok(ok, message);
  }
}

/** A 404 is expected here; other navigation failures still fail the flow. */
export async function recoverMissing(page, { base, timeline }) {
  timeline.mark("Open a missing route and return to learning");
  const response = await page.goto(`${base}/missing-page`, { waitUntil: "domcontentloaded" });
  const is404 = response?.status() === 404;
  timeline.check(is404, "The missing route returns HTTP 404");
  assert.ok(is404, "The missing route must return HTTP 404");
  await page.getByRole("heading", { name: "Page not found", exact: true }).waitFor();
  timeline.check(true, "The English missing-page screen appears");
  await checkSurface(page, { timeline });
  await page.waitForTimeout(800);
  await page.getByRole("link", { name: "To Learning", exact: true }).click();
  await page.getByRole("heading", { name: "Learn", exact: true }).waitFor();
  timeline.check(new URL(page.url()).pathname === "/learn", "The 404 return link opens learning");
}
