import { expect, type Page } from "@playwright/test";

// Solve through visible piece/slot buttons. No engine calls, debug API or state mutation.
export async function completeTangram(page: Page) {
  const iframe = page.getByTestId("embedded-game");
  await iframe.scrollIntoViewIfNeeded();
  const frame = iframe.contentFrame();
  await expect(frame.getByRole("button", { name: "Проверить", exact: true })).toBeVisible();
  while ((await frame.locator(".tray-piece").count()) > 0) {
    const piece = frame.locator(".tray-piece").first();
    const before = await frame.locator(".tray-piece").count();
    await piece.click({ delay: 60 });
    await expect(piece).toHaveClass(/is-selected/);
    // Equal-size triangles are interchangeable; choose the topmost eligible target.
    await frame.locator(".slot.selected-family").last().click({ delay: 60 });
    await expect(frame.locator(".tray-piece")).toHaveCount(before - 1);
  }
  await frame.getByRole("button", { name: "Проверить", exact: true }).click();
}
