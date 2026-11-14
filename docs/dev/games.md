# Game development guide

Any engine works. Every game plugs into the app through **one contract** and one of **two runtimes**, and the app (`<GameHost>`) never knows which engine is behind a game.

**Reference implementation:** `../game-store-planning` (our earlier project). It already has a tested any-engine bridge, engine build helpers, Phaser/GDevelop games and browser tests. **Port from it; don't redesign.** Paths below marked `GSP:`.

## Runtimes

| | `react` | `embedded` |
|---|---|---|
| For | simple DOM/SVG/Canvas learning games written here | Phaser, GDevelop, Three.js, vanilla, any static web build |
| Lives in | `packages/games/src/<id>/` | `games/<engine>-<name>/` (own workspace package + `manifest.json`) |
| Runs as | lazy React component (one chunk per game) | `<iframe>` of `/games/<id>/index.html` on our domain |
| Talks via | props + `onRound` / `onFinish` | `packages/game-bridge` (ported from GSP `bridge-core`) |
| Cleanup | React unmount | removing the iframe kills loops, audio and WebGL |

Not React, or uses an engine → `embedded`. Phaser included: engines keep global loops and WebGL state, and an iframe isolates them and keeps them out of the main bundle.

## Contract

```ts
// packages/core (pure types)
type GameResult = { gameId: string; level: number; rounds: number; mistakes: number; corrections: number; durationMs: number };

// packages/games/src/kit.ts
type GameProps = {
  level: number; seed: number;
  onRound(e: { correct: boolean; afterMistake: boolean }): void;
  onFinish(result: GameResult): void;
};
```
`<GameHost game level seed onRound onFinish />` renders `ReactGame` (via `load()` from the code registry) or `IframeGame` (via `runtimeUrl` from the `Game` DB row). Both run inside an error boundary. **The server validates every `GameResult` before `core` rewards it** (T-81).

Rules for every game:
1. **Games report; `core` rewards.** A game never decides ★ or stat changes.
2. **Own-domain only.** No CDN, fonts, analytics or external links ([rules.md](../product/rules.md#technical-requirements)).
3. **Seeded where possible**, so tests and demos repeat exactly.
4. **Fit the shell.** Touch-first, ≥ 48px targets, 360px to iPad landscape, reduced motion respected.
5. **Fun games** may never finish on their own. The shell's 10-min timer ends them.

## Bridge (embedded games): port GSP `packages/bridge-core`

Proven design, ~2.3k lines with tests. Keep it; strip the PECS-only parts (`pecs-events.ts`, `speech.ts`, the `assets.card` / `tts.speak` host methods, the analytics outbox). Rename the global `GameStoreBridge` → `Brainee`.
- **Handshake:** the game posts `hello` (with its contract id, e.g. `rocket-runner@1`) **every 2 s until answered**. The host checks the sender window and replies `init` + a private `MessageChannel` port. A nonce guards the welcome. No answer means "unbridged" and the game still plays.
- **Traffic:** launch config in `init` (level, seed); lifecycle (`ready`, `paused`, `resumed`, `completed`, `exited`, `error`); events with `eventId` (round answered, game finished → `GameResult`); fast state (live score); RPC (`session.exit`).
- **Host validates with zod.** Unknown types are dropped; 64 KB message cap; rate limit.
- **Delivered as** an ESM import for workspace games, plus an IIFE drop-in `bridge.js` for exports.
- **Standalone mode:** opened outside the app, it reads `?level=&seed=` from the URL, so engine developers can test in their own tool.
- **Engine adapters (composition, no base game class):** `phaserAdapter` + `BridgedScene` (GSP `phaser-core`), `gdevelopAdapter` (GSP `gdevelop-core`), `domAdapter`.

## Engine packages and build

Port the GSP pattern: shared **engine kits** + one **workspace package per embedded game**.
```
packages/engine-phaser/     # GSP phaser-core: adapter, BridgedScene, standalone boot, buildPhaserPackage (esbuild)
packages/engine-gdevelop/   # GSP gdevelop-core: buildGDevelopPackage (`gdexporter` headless export), runtime hook
games/phaser-<name>/        # package.json, manifest.json, build.mjs → dist/
games/gdevelop-<name>/      # project/ (editable .json + assets, committed) → build.mjs exports dist/
```
- **GDevelop:** commit the **editable project**, not the export. `buildGDevelopPackage` runs `gdexporter`, exposes the runtime to the adapter and injects `bridge.js`. JavaScript code events call `window.Brainee.*`.
- **Phaser:** esbuild bundle via `buildPhaserPackage`; scenes extend `BridgedScene`.
- **Prebuilt static build** (Godot, other tools): a package whose `dist/` is committed, with the drop-in `bridge.js`. Unity WebGL: not without a decision entry (too heavy for iPad).

**`pnpm games:build`** (port GSP `scripts/build-packages.mjs`): build `bridge.js` → run each game's `build.mjs` → **replace** (not merge) `apps/web/public/games/<id>/` with its `dist/`. **`pnpm db:seed`** reads every `manifest.json` into the `Game` table, so registering a game is just adding its package.

Manifest (trimmed from GSP):
```jsonc
{ "id": "phaser-shape-match", "kind": "dev", "title": "Найди пару", "engine": "phaser",
  "skills": { "main": "attention" }, "levels": 2,
  "runtimeUrl": "/games/phaser-shape-match/index.html", "version": "0.1.0", "license": "own" }
```
Third-party assets go in the game's `CREDITS.md` (GSP pattern).

## Testing (from GSP's four-tier setup)
1. **Unit:** seeded rounds, bridge protocol (port GSP `bridge.test.ts`, `adapters.test.ts`).
2. **Asset integrity:** `pnpm test:assets` (port GSP `verify-game-assets.mjs`): every script, CSS and asset referenced in each build exists, and `bridge.js` is present.
3. **Browser handshake (Playwright, Chromium + WebKit):** each game loads, makes 0 console errors and 0 requests outside our origin, connects, sends `ready`.
4. **Gameplay smoke:** click through one round → expect `round` / `finish` events.

Lessons GSP's browser tests surfaced, which apply to us because the iPad runs WebKit:
- A slow page hydrates after the game starts → **hello must repeat** (GSP `e2e/bridge-timing.spec.ts`).
- In **WebKit**, streamed pages give a new `event.source` proxy per message → the host also accepts its own child frames, and the nonce does the real check.
- Tests assert on the **bridge status** (`data-testid="event-stream"` with `data-status=connected`), not page text.
- **Run `pnpm games:build` before e2e** after any bridge change. Games bundle the bridge, and a stale build fails confusingly.

## Lab
A dev-only `/lab` route in `apps/web` (no separate app): game picker from the `Game` table plus React registry, level/seed, phone/iPad frame, and the **event stream panel** (bridge status + live events), which e2e reads too. Embedded-game developers can also use standalone mode inside their engine.

## Isolation
Our own games: `sandbox="allow-scripts allow-same-origin"`. This isolates lifecycle; it is not a security boundary, so only audited code goes in. The bridge doesn't need same-origin. If we ever accept untrusted builds, serve them with GSP's `Content-Security-Policy: sandbox allow-scripts …` + `Access-Control-Allow-Origin: *` headers (GSP `src/app/game-builds/[...path]/route.ts`): an opaque origin that can still load its own files.

## Reusable GSP games (candidates)

| GSP package | Engine | Fit for Brainee | Notes |
|---|---|---|---|
| `phaser-shape-match-game` | Phaser | attention/logic learning game | kid-friendly already; translate UI to Russian |
| `gdevelop-pairs-game` | GDevelop | memory ("Повтори за Брейни" stand-in) | official MIT sample |
| `gdevelop-sokoban-game` | GDevelop | logic / *do the hard thing* | MIT (GDevelop examples) |
| `phaser-picture-puzzle-game` | Phaser | fun or logic | CC0 art (Kenney); check that pictures load locally |
| `three-subway-runner-game` | Three.js | fun ("Ракета-раннер" analog) | ⚠ heavy `.glb` on iPad; **drop `talia.glb`** (third-party IP, breaks the product rule) |

PECS board games and the sample game don't fit. Porting a candidate is T-85.

## Porting prototype games
Odd one out and Continue the pattern → `react` runtime. Prototype lines 901–982 ([ideas/README.md](../ideas/README.md)). Catalog: [screens.md](../product/screens.md#learn-учимся).
