import { learningEvents } from "@brainee/game-bridge/learning";
import { test as base, expect } from "@playwright/test";

export { expect };
export const test = base.extend<{ audit: void }>({
  audit: [
    async ({ page, baseURL }, use) => {
      const errors: string[] = [];
      const foreign: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        // Chromium reports the sandbox correctly blocking Phaser's automatic focus as
        // a console error. It is a browser policy diagnostic, not a game exception.
        if (
          process.env.GAME_TEST_REMOTE === "1" &&
          message.text() ===
            "Permissions policy violation: focus-without-user-activation is not allowed in this document."
        )
          return;
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== baseURL) foreign.push(request.url());
      });
      await use();
      expect(errors).toEqual([]);
      expect(foreign).toEqual([]);
    },
    { auto: true },
  ],
});
export async function launch(page: import("@playwright/test").Page, id: string, scored = true) {
  await page.goto(`/?id=${id}`);
  const iframe = page.getByTestId(scored ? "embedded-game" : "explore-frame");
  await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
  return iframe.contentFrame();
}
export async function events(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      (window as unknown as { gameEvents: { name: string; payload: Record<string, unknown> }[] })
        .gameEvents,
  );
}
export async function finished(page: import("@playwright/test").Page, id: string) {
  await expect
    .poll(async () => (await events(page)).filter((e) => e.name === "finish").length)
    .toBe(1);
  const list = await events(page);
  const result = learningEvents.finish.parse(list.find((e) => e.name === "finish")?.payload);
  expect(result.gameId).toBe(id);
  expect(result.rounds).toBe(4);
  expect(list.filter((e) => e.name === "round" && e.payload.correct)).toHaveLength(4);
}
export async function unscored(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(() => (window as unknown as { acceptedEvents: unknown[] }).acceptedEvents),
  ).toEqual([]);
  expect((await events(page)).filter((e) => e.name === "finish" || e.name === "round")).toEqual([]);
}
