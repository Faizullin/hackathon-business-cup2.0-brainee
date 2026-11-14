import { expect, type Page } from "@playwright/test";

// Solve through visible piece/slot buttons. No engine calls, debug API or state mutation.
export async function completeTangram(page: Page) {
  const iframe = page.getByTestId("embedded-game");
  await iframe.scrollIntoViewIfNeeded();
  const frame = iframe.contentFrame();
  await expect(frame.getByRole("button", { name: "Check", exact: true })).toBeVisible();
  // A solved picture is shown briefly before the next one loads.
  await expect(frame.locator("#game")).toHaveAttribute("data-turn", "play");
  while ((await frame.locator(".tray-piece").count()) > 0) {
    const piece = frame.locator(".tray-piece").first();
    const before = await frame.locator(".tray-piece").count();
    await piece.click({ delay: 60 });
    await expect(piece).toHaveClass(/is-selected/);
    // Equal-size triangles are interchangeable; choose the topmost eligible target.
    await frame.locator(".slot.selected-family").last().click({ delay: 60 });
    await expect(frame.locator(".tray-piece")).toHaveCount(before - 1);
  }
  const progress = await frame.locator(".session-progress").textContent();
  await frame.getByRole("button", { name: "Check", exact: true }).click({ delay: 60 });
  if (!progress?.includes("4 of 4"))
    await expect(frame.locator(".session-progress")).not.toHaveText(progress ?? "");
}
