// Local proof fixture only: the standalone GSP build stays outside tracked files.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(
  process.argv[2] ?? "../game-store-planning/public/builds/phaser-shape-match-game",
);
const target = resolve(".local/remote-shape-match");
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
const bundle = readFileSync(`${target}/index.js`, "utf8");
if (bundle.split('"game-store"').length !== 2)
  throw new Error("Upstream bridge tag changed: review before adapting");
writeFileSync(`${target}/index.js`, bundle.replace('"game-store"', '"brainee"'));
cpSync("games/shape-pairs/thumbnail.svg", `${target}/thumbnail.svg`);
writeFileSync(
  `${target}/CREDITS.md`,
  "Phaser Shape Match: local game-store-planning standalone build. Phaser license is preserved in the bundle. Bridge tag adapted from game-store to brainee. Thumbnail from Brainee Shape Pairs.\n",
);
writeFileSync(
  `${target}/manifest.json`,
  JSON.stringify({
    id: "phaser-shape-match",
    source: "remote",
    scored: false,
    version: "0.1.0",
    title: "Shape Match (Remote)",
    mode: "explore",
    entry: "/g/phaser-shape-match/0.1.0/index.html",
    thumbnail: "/g/phaser-shape-match/0.1.0/thumbnail.svg",
    minAge: 4,
    license: "own; Phaser MIT",
    sizeBudgetBytes: 10000000,
    explore: {
      family: "phaser",
      viewport: "responsive",
      orientation: "any",
      audio: false,
      readiness: "bridge",
    },
  }),
);
console.log("Prepared .local/remote-shape-match; publish it with games:publish.");
