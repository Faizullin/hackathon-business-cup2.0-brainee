# Game development guide

Any engine works. Every game plugs into the app through **one contract** and one of **two runtimes**, and the app (`<GameHost>`) never knows which engine is behind a game.

**Reference implementation:** `../game-store-planning` (our earlier project). It already has a tested any-engine bridge, engine build helpers, Phaser/GDevelop games and browser tests. **Port from it; don't redesign.** Paths below marked `GSP:`.

## Scaling: three paths in, one contract (D-16)

The app works with **built games, not source**. Wherever a game is made, it ends up as a static build + `manifest.json`, catalogued in the DB and run by `GameHost`.

| Path | For | Source lives | Runtime | Status |
|---|---|---|---|---|
| **A · React** | small, tightly integrated learning games | `packages/games/src/<id>/` | `react` | ✅ odd-one-out, continue-pattern |
| **B · In-repo engine** | Phaser/GDevelop games we write | `games/<engine>-<name>/` workspace package | `embedded` | ✅ Picture Puzzle |
| **C · External** | other repos, teams or engines | **outside this repo**; we import a pinned, checksummed build artifact | `embedded` | later (T-91) |

Rules that keep it scalable:
- **Manifest = single source**, schema-validated by `pnpm check`: id, version, engine, runtime, entry, skills, levels, bridge protocol + contract (`<id>@<n>`), size budget, license (T-89).
- **Catalog in the DB** (`Game` + `GameVersion`), filled from manifests: adding a B/C game needs no app code; versions can be pinned, rolled back or disabled.
- **Versioned bridge:** the host supports protocol N and N−1; games learn host capabilities in `init`.
- **One conformance suite for every game** (T-90): loads, `ready` ≤ 10 s, exactly one `finish`, zero foreign requests, size budget, no console errors, Chromium + WebKit. A game is listed only after it passes. A new engine = a ~30-line adapter + passing the suite.
- **Trust tiers:** our games → same-origin iframe; third-party → opaque-origin sandbox (CSP `sandbox` header) or a `games.` subdomain, with per-version host-method allowlists and zod validation.
- **Hosting:** copy builds into `public/games/` at build time now; move to our-subdomain object storage when they outgrow it (still allowlistable).
- **Choosing:** new + simple → A; needs an engine/heavy deps → B; another repo/team/engine → C (no submodules, no copied source).

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
  level: number; seed: number; text: GameText;
  onRound(e: { correct: boolean; afterMistake: boolean }): void;
  onFinish(result: GameResult): void;
};
```
`<GameHost game level seed text onRound onFinish />` renders `ReactGame` (via `load()` from the code registry) or `IframeGame` (via `runtimeUrl` from the `Game` DB row). Both run inside an error boundary. `GameText` is defined in `kit.ts`; the web host supplies Russian strings from `i18n/ru.ts`. Shared shape types and the SVG renderer live in `src/kit/`; game folders may import that kit, core, npm and their own files, never another game. `pnpm check:games` checks this boundary. **The server validates every `GameResult` before `core` rewards it** (T-81).

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
A dev-only `/lab` route in `apps/web` (no separate app; React and embedded games, `BRAINEE_LAB=1` enables it in production builds): game picker (validated manifest registry), level/seed, phone/iPad frame, and the **event stream panel** (bridge status + live events), which e2e reads too. Embedded-game developers can also use standalone mode inside their engine.

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

## Implemented platform slice (T-29 / T-85 / T-89 / T-90)

- `packages/game-bridge` ports GSP's `bridge-core` transport, endpoints, repeat-hello handshake, DOM/GDevelop adapters and tests. The drop-in script exposes `window.Brainee`; PECS, speech, card/progress host methods and analytics outbox are removed. Protocol 2 supports protocol 1 (legacy `id` normalizes to `eventId`). Every incoming message is capped at 64 KiB and 50 messages/s; the last 1,000 event IDs are deduplicated. Contract event payloads use zod. Nonce + the private transferred MessageChannel bind the connection to the iframe; these audited same-origin builds are not a security boundary.
- `packages/engine-phaser` ports the GSP Phaser adapter, `BridgedScene`, responsive factory and esbuild helper. Scenes send `ready` only after assets and launch config are loaded. `IframeGame` waits at most 10 seconds for ready, renders an error and removes the frame on failure; unmount closes the bridge and removes the iframe's timers/audio/renderer. A finish must agree with the observed rounds and issued game/level before the existing LearningProvider submits it. Lab launches use an ephemeral ID and never save rewards.
- Every React folder and engine game has `manifest.json`. `packages/game-catalog` validates and exports the registered manifests; DB seed and embedded registry consume them. `pnpm check` validates manifests, entry paths, weights and React source budgets; `pnpm test:assets` additionally checks embedded output budgets, HTML/CSS references, pictures and bridge build. React budgets are source bytes in this light slice; embedded budgets are uncompressed artifact bytes. Version-history/rollback (`GameVersion`) and automatic path-C imports remain future work.
- `games/picture-puzzle` is path B. Phaser 4 and the Rex jigsaw cutter are bundled locally, with Kenney CC0 pictures and preserved licences. **One session = four successful piece placements**, not four pictures. Each rejected placement increments mistakes; a successfully placed piece with one or more prior rejections increments corrections once. Picture changes reset per-piece attempts, retain the issued level and continue the four-placement counter. At four, input stops and exactly one `GameResult` is emitted. Partial play never finishes. Seed selects the starting picture; no family calendar/timezone dependency. Five levels retain GSP's short-side `<700px` cap at 3×4 pieces. The host's Russian chrome surrounds language-light canvas controls; no remote speech/font is used.
- `pnpm games:build` replaces the public embedded-game directories and emits `public/games/bridge.js`; `pnpm build` runs it first. Generated artifacts stay ignored. Use `pnpm games:build` before `pnpm dev` on a fresh checkout. `pnpm db:push && pnpm db:seed` adds runtime columns/catalog to existing local data; `pnpm demo` starts from a full reset.
- `game-conformance.spec.ts` loops all manifests in Chromium/WebKit, phone/landscape iPad: ready within 10 seconds, real pointer input, exactly one finish, no console errors/foreign requests. Puzzle coverage includes rejection→correction, server receipt replay without another reward, stopping, timeout cleanup and screenshots. `pnpm test` retains the ported bridge/geometry/layout tests.

The sections above describing full GDevelop build tooling, per-version trust tiers and external artifact imports are the longer-term design; this slice supplies its generic GDevelop bridge adapter, but not a GDevelop export kit.

## Pinned path C: Tangram Tales (T-105)

`games/tangram-tales/artifact/` contains 47 selected, unmodified QLOBE files from commit `60967634e6cc313c41a5aa8067bed9f0f616176c`, including MIT LICENSE. `sources.lock.json` records upstream paths, Git blob hashes and SHA-256; `pnpm check` checks every retained byte. The handoff launcher was reviewed but not executed: only the selected pinned files were fetched and verified outside the repo. Normal builds are offline.

`scripts/build-tangram.mjs` copies that artifact and applies a bounded guided-mode port plus `session.js`/`session.css`/Russian HTML to `public/games/tangram-tales/`. The served engine omits debug, free play, shelf, storage, narration and idle prompting. The original 16 silhouettes, shape-family equivalence, target geometry and snapping remain. Native buttons use select-then-place input, including keyboard activation; orientation snaps automatically. Drag/hold rotation is omitted from this simplified guided version. Controls fit the phone iframe and landscape iPad; no race between pointer-up replacement and compatibility click.

The manifest specifies logic .7 / motor .3, age 6+, three levels. Levels leave 4/5/6 pieces to place, selected deterministically by the issued seed. A session selects four distinct silhouettes from the 16. **Round = one fully assembled silhouette confirmed with «Проверить».** Check while incomplete reports one mistake; completing after one or more failed checks reports exactly one correction. Selection, failed placement and rotation never count as rounds/mistakes. Four rounds produce exactly one finish; pagehide/unmount stops without finishing. All timing is elapsed monotonic time, with no family timezone dependency.

`game-conformance.spec.ts` covers the same ready/finish/network/console contract as every other listed game. `tangram.spec.ts` covers a failed check → correction → four silhouettes → one persisted reward and idempotent receipt replay, stopping, levels 1/2 and repeated mistakes with one correction; level 3 is covered by conformance/reward tests. All run on Chromium/WebKit at phone and landscape iPad sizes. No debug/win helper or programmatic game-state mutation is used.

Mirror Grid and subsequent Wave 1/Wave 2 titles remain unlisted until their own engine adapters, Russian content and real-input acceptance tests pass. See [external-games.md](../product/external-games.md) for the ordered import queue.
