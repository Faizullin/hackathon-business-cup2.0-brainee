import { expect, it } from "vitest";
import { newSnake, spendPlayTime, stepSnake } from "./leisure";

it("charges only reported active seconds, bounded by server elapsed time", () => {
  expect(spendPlayTime(600, 50, 0)).toBe(600);
  expect(spendPlayTime(600, 2, 15)).toBe(598);
  expect(spendPlayTime(2, 15, 15)).toBe(0);
  expect(() => spendPlayTime(600, 30, 600)).toThrow();
});
it("snake grows on food, ignores reversing and ends at a wall", () => {
  const start = newSnake();
  expect(stepSnake(start, "left").body[0]).toBe(66);
  let game = start;
  for (let i = 0; i < 4; i++) game = stepSnake(game, "right");
  expect(game.score).toBe(1);
  expect(game.body.length).toBe(4);
  for (let i = 0; i < 3; i++) game = stepSnake(game, "right");
  expect(game.over).toBe(true);
  expect(stepSnake(game, "up")).toBe(game);
});
