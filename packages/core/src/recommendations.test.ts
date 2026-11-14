import { describe, expect, it } from "vitest";
import { type AbilityScores, recommendGames } from "./recommendations";

const now = Date.UTC(2026, 10, 14);
const week = 7 * 24 * 60 * 60 * 1000;
const averages: AbilityScores = {
  speech: 50,
  reading: 50,
  logic: 50,
  attention: 50,
  memory: 50,
  motor: 50,
};
const scores: AbilityScores = {
  speech: 45,
  reading: 40,
  logic: 90,
  attention: 30,
  memory: 70,
  motor: 60,
};
const games = [
  { id: "speech", kind: "dev", skills: { main: "speech" } },
  { id: "reading", kind: "dev", skills: { main: "reading" } },
  { id: "odd", kind: "dev", skills: { main: "attention" } },
  { id: "pattern", kind: "dev", skills: { main: "logic", secondary: "attention" } },
  { id: "fun", kind: "fun", skills: { main: "attention" } },
] as const;

describe("entry recommendations", () => {
  it("ranks the three largest gaps against the supplied age averages", () => {
    const recommended = recommendGames(scores, averages, games, [], now);
    expect(recommended.map(({ skill, gap, game }) => [skill, gap, game.id])).toEqual([
      ["attention", -20, "odd"],
      ["reading", -10, "reading"],
      ["speech", -5, "speech"],
    ]);
    expect(recommended[0]).toMatchObject({ score: 30, ageAverage: 50, playedLast7Days: 0 });
    expect(recommendGames(scores, { ...averages, speech: 80 }, games, [], now)[0]?.skill).toBe(
      "speech",
    );
  });
  it("uses least-played before main-skill preference, within an inclusive seven-day window", () => {
    expect(
      recommendGames(scores, averages, games, [{ gameId: "odd", finishedAt: now - week }], now)[0]
        ?.game.id,
    ).toBe("pattern");
    const ignored = [
      { gameId: "odd", finishedAt: now - week - 1 },
      { gameId: "odd", finishedAt: now + 1 },
    ];
    expect(recommendGames(scores, averages, games, ignored, now)[0]?.game.id).toBe("odd");
    const history = [
      ...ignored,
      { gameId: "odd", finishedAt: now },
      { gameId: "odd", finishedAt: now - 1 },
      { gameId: "pattern", finishedAt: now - 1 },
    ];
    expect(recommendGames(scores, averages, games, history, now)[0]).toMatchObject({
      game: { id: "pattern" },
      playedLast7Days: 1,
    });
  });
  it("offers a game once and returns fewer cards if top-gap skills have no available game", () => {
    const weak = { ...scores, logic: 10 };
    const recommended = recommendGames(weak, averages, games, [], now);
    expect(recommended.map(({ game }) => game.id)).toEqual(["pattern", "odd", "reading"]);
    const onlyPattern = recommendGames(
      weak,
      averages,
      games.filter((game) => game.id === "pattern"),
      [],
      now,
    );
    expect(onlyPattern).toHaveLength(1);
    expect(recommendGames(scores, averages, [], [], now)).toEqual([]);
    expect(
      recommendGames(
        scores,
        averages,
        games.filter((game) => game.kind === "fun"),
        [],
        now,
      ),
    ).toEqual([]);
  });
  it("breaks equal play counts deterministically without mutating inputs", () => {
    const tied = [
      { id: "z", kind: "dev", skills: { main: "attention" } },
      { id: "a", kind: "dev", skills: { main: "attention" } },
    ] as const;
    expect(recommendGames(scores, averages, tied, [], now)[0]?.game.id).toBe("a");
    expect(tied[0].id).toBe("z");
    expect(scores.attention).toBe(30);
  });
  it("requires complete numeric scores and explicit time", () => {
    expect(() =>
      recommendGames({ ...scores, logic: Number.NaN }, averages, games, [], now),
    ).toThrow(RangeError);
    expect(() => recommendGames(scores, { ...averages, logic: 101 }, games, [], now)).toThrow(
      RangeError,
    );
    expect(() => recommendGames(scores, averages, games, [], Number.NaN)).toThrow(RangeError);
  });
});
