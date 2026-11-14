import assert from "node:assert/strict";

export { checkSurface } from "./common.mjs";

const NEXT = /^(Дальше|Готово)$/;
const pause = (page, ms = 450) => page.waitForTimeout(ms);

async function nextAppears(page, timeout = 1200) {
  try {
    await page.getByRole("button", { name: NEXT }).waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Plays whichever learning game is open (4 rounds), using only what a child sees:
 * Odd one out by its unique SVG; Continue the pattern by trying answers in order,
 * so a wrong first try shows the hint and the correction star.
 */
export async function playGame(page, { timeline }) {
  const odd = page.getByRole("button", { name: /^Фигура \d+$/ });
  const pattern = page.getByRole("button", { name: /^Ответ \d+$/ });
  await odd.or(pattern).first().waitFor({ timeout: 20000 });
  const isOdd = (await odd.count()) > 0;
  timeline.mark(isOdd ? "Play Odd one out" : "Play Continue the pattern");
  let mistakes = 0;
  for (let round = 0; round < 4; round++) {
    await odd.or(pattern).first().waitFor();
    await pause(page, 700);
    if (isOdd) {
      const shapes = await odd
        .locator("svg")
        .evaluateAll((elements) => elements.map((element) => element.innerHTML));
      const index = shapes.findIndex((shape) => shapes.filter((s) => s === shape).length === 1);
      assert.ok(index >= 0, "One shape differs");
      await odd.nth(index).click();
    } else {
      let solved = false;
      for (let choice = 0; choice < 3 && !solved; choice++) {
        await pattern.nth(choice).click();
        solved = await nextAppears(page);
        if (!solved) {
          mistakes += 1;
          await pause(page, 600);
        }
      }
      assert.ok(solved, "One answer continues the pattern");
    }
    assert.ok(await nextAppears(page, 5000), "The round can continue");
    await pause(page);
    await page.getByRole("button", { name: NEXT }).click();
  }
  timeline.check(true, `Four rounds played${mistakes ? ` (${mistakes} corrected)` : ""}`);
}

/** Checks the no-exit post-game screen and lingers so the recording shows it. */
export async function showPostGame(page, { timeline, args }) {
  const screen = page.getByTestId("post-game");
  await screen.waitFor({ timeout: 20000 });
  await page.getByTestId("earned-stars").waitFor();
  await page.getByRole("img", { name: "После игры" }).waitFor();
  timeline.check(true, `Game ${args.game}: «Игра пройдена!» shows stars and Brainy before → after`);
  const breakCard = page.getByTestId("break-suggestion");
  if (args.game === 3) {
    await breakCard.waitFor();
    const bonus = page.getByTestId("streak-bonus");
    if (await bonus.count()) {
      timeline.check(
        /\+5/.test((await bonus.textContent()) ?? ""),
        "The third game adds today's +5 ★ break bonus",
      );
    } else {
      // Phone and iPad recordings can share a child: the second device cannot earn it again.
      const response = await page.request.get(new URL("/api/state", page.url()).href);
      assert.ok(response.ok());
      const { snapshot } = await response.json();
      timeline.check(
        snapshot.progress.streak.bonusGiven,
        "Today's bonus is already claimed; the break still appears",
      );
    }
  } else {
    timeline.check((await breakCard.count()) === 0, "No break suggestion before the third game");
  }
  await pause(page, 1500);
  await page.mouse.wheel(0, 600);
  await pause(page, 1200);
}
