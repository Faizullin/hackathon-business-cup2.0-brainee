import type { StateSnapshot } from "@brainee/core";
import { type APIRequestContext, expect, type Page } from "@playwright/test";

export async function savedState(request: APIRequestContext): Promise<StateSnapshot> {
  const response = await request.get("/api/state");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.changed).toBe(true);
  return body.snapshot;
}

export async function readyState(page: Page) {
  await expect(page.locator('[data-mode="child"], [data-game]').first()).toBeVisible();
  return savedState(page.request);
}
