import { events, expect, launch, test } from "./fixture";

test("unpublished remote build: sandbox, ready, no foreign dependencies", async ({
  page,
  request,
}) => {
  const id = process.env.GAME_TEST_REMOTE_ID ?? "";
  const game = await (await request.get(`/manifest/${id}.json`)).json();
  await launch(page, id, game.scored);
  await expect(page.locator("iframe")).toHaveAttribute("sandbox", "allow-scripts");
  expect((await events(page)).filter((event) => event.name === "finish")).toEqual([]);
  // Readiness is generic; game-specific interaction/result coverage belongs in game.spec.ts.
});
