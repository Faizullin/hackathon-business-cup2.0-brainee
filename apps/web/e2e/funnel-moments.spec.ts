import { expect, test } from "@playwright/test";

test("funnel previews match once and show all real stages without sessions or rewards", async ({
  page,
}, info) => {
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(new URL(r.url()).pathname);
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start?tour=1#growth");
  const slider = page.getByRole("slider", { name: "Explore Brainy's stages" });
  const stages = ["Sleepy", "Awake", "Lively", "Smart", "Genius"];
  for (let i = 0; i < stages.length; i++) {
    await slider.focus();
    await page.keyboard.press(i === 0 ? "Home" : "ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuetext", stages[i] as string);
    await expect(page.getByTestId("funnel-growth")).toHaveAttribute(
      "data-stage",
      ["sleepy", "awake", "lively", "smart", "genius"][i] as string,
    );
  }
  await page.screenshot({ path: info.outputPath("growth-genius.png"), fullPage: true });
  await page.goto("/start?tour=1#match");
  await page.getByRole("button", { name: "Circle", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Look for the same four corners.");
  await page.getByRole("button", { name: "Diamond", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("A match. This round is finished.");
  await expect(page.getByRole("button", { name: "Diamond", exact: true })).toBeDisabled();
  await page.screenshot({ path: info.outputPath("match-complete.png"), fullPage: true });
  expect(writes).toEqual([]);
});
