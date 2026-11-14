# Neighborhood Route Planner (`neighborhood-map-walk`) Integration Guide

## Overview
- **Game ID**: `neighborhood-map-walk`
- **Title**: `Neighborhood Route Planner`
- **Entry point**: `/games/neighborhood-map-walk/index.html`
- **Mode**: `explore` (unscored exploration preview)
- **Host label**: `Свободная игра · без звёзд`
- **Minimum age**: `5`
- **License**: `MIT`
- **Size budget**: `6000000` bytes

## Unscored Exploration Rules
This game is an unscored free play preview:
- **No scoring events**: Does NOT emit `round`, `finish`, or submit `GameResult`.
- **No rewards/stars**: Does not grant ★ or mutate ability stats.
- **No learning sessions**: Runs outside the guided learning curriculum.
- **Modes preserved**:
  1. **Draw Home** (`showHouse`): Freeform canvas drawing of home with magic transformation into watercolor building.
  2. **Wind Road** (`showRoad`): Drawing roads connecting the neighborhood.
  3. **Place Landmarks** (`showPlace`): Placing community spots (school, shop, library, park, pond, flowers, trees).
  4. **Living Neighborhood** (`showFinale`): Animated scene with toy car traversing roads and animated town elements.
- **Language**: English interface and audio content are preserved.

## Host Wrapper & Controls
- **Host Bar**: Top 48px banner styled with theme `#1e293b`.
- **Badge**: `'Свободная игра · без звёзд'`.
- **Exit Button**: `data-testid="host-exit-button"`, touch target ≥ 48px.
  - On click, emits `session.exit` via `window.Brainee.call('session.exit')`, `bridge.lifecycle('exited')`, and posts `{ type: 'session.exit', gameId: 'neighborhood-map-walk' }` to the parent window.
- **Audio**: Starts muted (`muted = true`), audio plays only on intentional interaction via the in-game HUD sound toggle button.
- **Security / Origin**: 100% same-origin, zero CDN dependencies, microphone blocked, external links guarded.

## Offline Build Command
```js
import { buildGame } from "./games/neighborhood-map-walk/build.mjs";

await buildGame("apps/web/public/games/neighborhood-map-walk");
```
CLI execution:
```sh
node games/neighborhood-map-walk/build.mjs apps/web/public/games/neighborhood-map-walk
```
