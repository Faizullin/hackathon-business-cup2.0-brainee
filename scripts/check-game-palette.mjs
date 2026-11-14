import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tokens = readFileSync(
  new URL("../packages/ui/src/tokens.css", import.meta.url),
  "utf8",
).split("@media")[0];
const palette = readFileSync(
  new URL("../packages/ui/src/lib/game-palette.ts", import.meta.url),
  "utf8",
);
const mapping = {
  surface: "bg",
  tile: "surface",
  tileRing: "line",
  selected: "mint",
  selectedWash: "violet-wash",
  correct: "sky",
  correctWash: "gain-wash",
  retry: "coral",
  retryWash: "loss-wash",
  star: "sun",
  highlight: "pink",
};
for (const [key, token] of Object.entries(mapping)) {
  const hex = palette.match(new RegExp(`${key}:\\s*"(#[A-Fa-f0-9]+)"`))?.[1];
  assert.equal(
    hex?.toLowerCase(),
    tokens.match(new RegExp(`--${token}:\\s*(#[A-Fa-f0-9]+)`))?.[1]?.toLowerCase(),
    `${key} drifted from --${token}`,
  );
  const cssKey = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  assert.ok(
    tokens.includes(`--game-${cssKey}: var(--${token});`),
    `${cssKey} must alias --${token}`,
  );
}
console.log("Game palette matches the shared UI tokens.");
