import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { manifests, previews, THUMBNAIL_MAX_BYTES, thumbnailUrl } from "./index";

const root = fileURLToPath(new URL("../../../", import.meta.url));
/** The folder each game ships from; games:build copies its thumbnail.svg to thumbnailUrl(id). */
const source = (id: string, runtime: string) =>
  runtime === "react"
    ? `${root}packages/games/src/${id}/thumbnail.svg`
    : `${root}games/${id}/thumbnail.svg`;

it("every learning game and preview has an existing, small, self-contained 4:3 thumbnail", () => {
  const games = [
    ...manifests.map((game) => ({ id: game.id, thumbnail: game.thumbnail, runtime: game.runtime })),
    ...previews.map((game) => ({ id: game.id, thumbnail: game.thumbnail, runtime: "embedded" })),
  ];
  expect(games.length).toBeGreaterThanOrEqual(9);
  for (const game of games) {
    expect(game.thumbnail).toBe(thumbnailUrl(game.id));
    const path = source(game.id, game.runtime);
    expect(existsSync(path), path).toBe(true);
    expect(statSync(path).size, path).toBeLessThanOrEqual(THUMBNAIL_MAX_BYTES);
    const svg = readFileSync(path, "utf8");
    expect(svg).toMatch(/^<svg[^>]*viewBox="0 0 160 120"/);
    expect(svg).not.toMatch(/<(text|script|image|foreignObject)\b|href=|url\(|font-family/i);
  }
});
