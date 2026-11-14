# Magnet Mission Lab (`magnet-explorer`) Integration Guide

## Overview
- **Game ID**: `magnet-explorer`
- **Title**: `Magnet Mission Lab`
- **Entry point**: `/games/magnet-explorer/index.html`
- **Mode**: `explore` (unscored exploration preview)
- **Host label**: `Свободная игра · без звёзд`
- **Minimum age**: `6`
- **License**: `MIT`
- **Size budget**: `7000000` bytes

## Unscored Exploration Rules
This game is an unscored free play preview:
- **No scoring events**: Does NOT emit `round`, `finish`, or submit `GameResult`.
- **No rewards/stars**: Does not grant ★ or mutate ability stats.
- **No learning sessions**: Runs outside the guided learning curriculum.
- **Modes preserved**:
  1. **Test Station** (`test-lab`): Hands-on material attraction test with physical feedback.
  2. **Treasure Sweep** (`treasure-sweep`): Magnetic debris gathering into trays.
  3. **Magnet Maze** (`magnet-maze`): Marble guidance along wooden track.
- **Language**: English interface and audio content are preserved.

## Host Wrapper & Controls
- **Host Bar**: Top 48px banner styled with theme `#1e293b`.
- **Badge**: `'Свободная игра · без звёзд'`.
- **Exit Button**: `data-testid="host-exit-button"`, touch target ≥ 48px.
  - On click, emits `session.exit` via `window.Brainee.call('session.exit')`, `bridge.lifecycle('exited')`, and posts `{ type: 'session.exit', gameId: 'magnet-explorer' }` to the parent window.
- **Audio**: Starts muted (`muted: true`), audio plays only on intentional interaction via the in-game HUD sound toggle button.
- **Security / Origin**: 100% same-origin, zero CDN dependencies, microphone blocked, external links guarded.

## Offline Build Command
```js
import { buildGame } from "./games/magnet-explorer/build.mjs";

await buildGame("apps/web/public/games/magnet-explorer");
```
CLI execution:
```sh
node games/magnet-explorer/build.mjs apps/web/public/games/magnet-explorer
```
