import { expect, type FrameLocator, type Page } from "@playwright/test";

export async function solveReflectionPattern(_page: Page, frame: FrameLocator) {
  const checkBtn = frame.getByRole("button", { name: "Проверить", exact: true });
  await expect(checkBtn).toBeVisible();

  // Find all sample dots and calculate required player dot colors via body evaluate
  const info = await frame.locator("body").evaluate(() => {
    const dots = Array.from(document.querySelectorAll<HTMLButtonElement>(".dot-btn"));
    const sampleDots = dots.filter((d) => d.classList.contains("sample-dot"));
    const playerDots = dots.filter((d) => !d.classList.contains("sample-dot"));

    // Determine grid size
    const xs = dots.map((d) => Number(d.dataset.x));
    const ys = dots.map((d) => Number(d.dataset.y));
    const gridW = Math.max(...xs) + 1;
    const gridH = Math.max(...ys) + 1;
    const isBilateral = sampleDots.every(
      (d) => Number(d.dataset.x) < gridW / 2 && Number(d.dataset.y) < gridH / 2,
    );

    // Calculate required color for every player dot
    const required: { x: number; y: number; targetColor: number; currentColor: number }[] = [];

    for (const p of playerDots) {
      const px = Number(p.dataset.x);
      const py = Number(p.dataset.y);
      const currentColor = Number(p.dataset.color);
      let targetColor = 0;

      if (!isBilateral) {
        // Vertical axis: sample is at (gridW - 1 - px, py)
        const sx = gridW - 1 - px;
        const sy = py;
        const sampleEl = sampleDots.find(
          (d) => Number(d.dataset.x) === sx && Number(d.dataset.y) === sy,
        );
        targetColor = sampleEl ? Number(sampleEl.dataset.color) : 0;
      } else {
        // Bilateral: sample is at min(px, gridW - 1 - px) and min(py, gridH - 1 - py)
        const sx = px >= gridW / 2 ? gridW - 1 - px : px;
        const sy = py >= gridH / 2 ? gridH - 1 - py : py;
        const sampleEl = sampleDots.find(
          (d) => Number(d.dataset.x) === sx && Number(d.dataset.y) === sy,
        );
        targetColor = sampleEl ? Number(sampleEl.dataset.color) : 0;
      }

      required.push({ x: px, y: py, targetColor, currentColor });
    }

    return { gridW, gridH, isBilateral, required };
  });

  // Cycle colors using real pointer clicks
  for (const item of info.required) {
    const btn = frame.locator(`.dot-btn[data-x="${item.x}"][data-y="${item.y}"]`);
    let cur = item.currentColor;
    while (cur !== item.targetColor) {
      await btn.click({ delay: 50 });
      cur = await btn.evaluate((el: HTMLButtonElement) => Number(el.dataset.color));
    }
  }

  // Click Check
  await checkBtn.click({ delay: 60 });
}
