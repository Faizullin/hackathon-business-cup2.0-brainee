# Game development guide

Any engine works. Every game plugs into the app through **one contract** and one of **two runtimes**, and the app (`<GameHost>`) never knows which engine is behind a game.

**Reference implementation:** `../game-store-planning` (our earlier project). It already has a tested any-engine bridge, engine build helpers, Phaser/GDevelop games and browser tests. **Port from it; don't redesign.** Paths below marked `GSP:`.

## Scaling: three paths in, one contract (D-16)

The app works with **built games, not source**. Wherever a game is made, it ends up as a static build + `manifest.json`, catalogued in the DB and run by `GameHost`.

| Path | For | Source lives | Runtime | Status |
|---|---|---|---|---|
| **A · React** | small, tightly integrated learning games | `packages/games/src/<id>/` | `react` | ✅ odd-one-out, continue-pattern |
| **B · In-repo engine** | Phaser/GDevelop games we write | `games/<engine>-<name>/` workspace package | `embedded` | ✅ Picture Puzzle |
| **C · External** | other repos, teams or engines | **outside this repo**; we import a pinned, checksummed build artifact | `embedded` | ✅ pinned imports and remote R2 versions (D-42) |

Rules that keep it scalable:
- **Manifest = single source**, schema-validated by `pnpm check`: id, version, engine, runtime, entry, skills, levels, bridge protocol + contract (`<id>@<n>`), size budget, license (T-89).
- **Catalog:** scored `Game` rows come from manifests; remote version history lives in the storage catalog (D-42), with enable/disable/rollback. Built-ins use generated registration.
- **Versioned bridge:** the host supports protocol N and N−1; games learn host capabilities in `init`.
- **One conformance suite for every game** (T-90): loads, `ready` ≤ 10 s, exactly one `finish`, zero foreign requests, size budget, no console errors, Chromium + WebKit. A game is listed only after it passes. A new engine = a ~30-line adapter + passing the suite.
- **Trust tiers:** our games → same-origin iframe; third-party → opaque-origin sandbox (CSP `sandbox` header) or a `games.` subdomain, with per-version host-method allowlists and zod validation.
- **Hosting:** built-ins copy into `public/games/` at build time; remote artifacts use R2 behind same-origin `/g/` (D-42).
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
`<GameHost game level seed text onRound onFinish />` renders `ReactGame` (via `load()` from the code registry) or `IframeGame` (via `runtimeUrl` from the `Game` DB row). Both run inside an error boundary. `GameText` is defined in `kit.ts`; the web host supplies the English dictionary from `i18n/en.ts` and passes `locale: "en"` in the iframe handshake. Shared shape types and the SVG renderer live in `src/kit/`; game folders may import that kit, core, npm and their own files, never another game. `pnpm check:games` checks this boundary. **The server validates every `GameResult` before `core` rewards it** (T-81).

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
{ "id": "phaser-shape-match", "kind": "dev", "title": "Find a Pair", "engine": "phaser",
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
Our own games: `sandbox="allow-scripts allow-same-origin"`. This isolates lifecycle; it is not a security boundary, so only audited code goes in. The bridge doesn't need same-origin. Remote builds now use the D-42 `/g/` handler with GSP's `Content-Security-Policy: sandbox allow-scripts …` + `Access-Control-Allow-Origin: *` headers (GSP `src/app/game-builds/[...path]/route.ts`): an opaque origin that can still load its own files.

## Reusable GSP games (candidates)

| GSP package | Engine | Fit for Brainee | Notes |
|---|---|---|---|
| `phaser-shape-match-game` | Phaser | attention/logic learning game | kid-friendly already; English UI |
| `gdevelop-pairs-game` | GDevelop | memory ("Repeat after Brainy" stand-in) | official MIT sample |
| `gdevelop-sokoban-game` | GDevelop | logic / *do the hard thing* | MIT (GDevelop examples) |
| `phaser-picture-puzzle-game` | Phaser | fun or logic | CC0 art (Kenney); check that pictures load locally |
| `three-subway-runner-game` | Three.js | fun ("Rocket Runner" analog) | ⚠ heavy `.glb` on iPad; **drop `talia.glb`** (third-party IP, breaks the product rule) |

PECS board games and the sample game don't fit. Porting a candidate is T-85.

## Porting prototype games
Odd one out and Continue the pattern → `react` runtime. Catalog: [screens.md](../product/screens.md#learn).

## Implemented platform slice (T-29 / T-85 / T-89 / T-90)

- `packages/game-bridge` ports GSP's `bridge-core` transport, endpoints, repeat-hello handshake, DOM/GDevelop adapters and tests. The drop-in script exposes `window.Brainee`; PECS, speech, card/progress host methods and analytics outbox are removed. Protocol 2 supports protocol 1 (legacy `id` normalizes to `eventId`). Every incoming message is capped at 64 KiB and 50 messages/s; the last 1,000 event IDs are deduplicated. Contract event payloads use zod. Nonce + the private transferred MessageChannel bind the connection to the iframe; these audited same-origin builds are not a security boundary.
- `packages/engine-phaser` ports the GSP Phaser adapter, `BridgedScene`, responsive factory and esbuild helper. Scenes send `ready` only after assets and launch config are loaded. `IframeGame` waits at most 10 seconds for ready, renders an error and removes the frame on failure; unmount closes the bridge and removes the iframe's timers/audio/renderer. A finish must agree with the observed rounds and issued game/level before the existing LearningProvider submits it. Lab launches use an ephemeral ID and never save rewards.
- Every React folder and engine game has `manifest.json`. `packages/game-catalog` validates and exports the registered manifests; DB seed and embedded registry consume them. `pnpm check` validates manifests, entry paths, weights and React source budgets; `pnpm test:assets` additionally checks embedded output budgets, HTML/CSS references, pictures and bridge build. React budgets are source bytes in this light slice; embedded budgets are uncompressed artifact bytes. Remote version history and rollback are now handled by the D-42 storage catalog rather than a `GameVersion` database table.
- `games/picture-puzzle` is path B. Phaser 4 and the Rex jigsaw cutter are bundled locally, with Kenney CC0 pictures and preserved licences. **One session = four successful piece placements**, not four pictures. Each rejected placement increments mistakes; a successfully placed piece with one or more prior rejections increments corrections once. Picture changes reset per-piece attempts, retain the issued level and continue the four-placement counter. At four, input stops and exactly one `GameResult` is emitted. Partial play never finishes. Seed selects the starting picture; no family calendar/timezone dependency. Five levels retain GSP's short-side `<700px` cap at 3×4 pieces. The host's English chrome surrounds language-light canvas controls; no remote speech/font is used.
- `pnpm games:build` replaces the public embedded-game directories and emits `public/games/bridge.js`; `pnpm build` runs it first. Generated artifacts stay ignored. Use `pnpm games:build` before `pnpm dev` on a fresh checkout. `pnpm db:push && pnpm db:seed` adds runtime columns/catalog to existing local data; `pnpm demo` starts from a full reset.
- The per-game specs plus the shared `imported-game-acceptance` / `explore-acceptance` helpers, `games-integration.spec.ts` and `own-origin.spec.ts` cover ready, real input, exactly one finish, rewards, receipt replay and foreign requests. Heavy game specs run only in `pnpm e2e:full` on WebKit iPad (see [setup.md](setup.md#e2e-matrix-tiered)); the former loop-all `game-conformance.spec.ts` was removed as a duplicate.

The sections above describing full GDevelop build tooling, per-version trust tiers and external artifact imports are the longer-term design; this slice supplies its generic GDevelop bridge adapter, but not a GDevelop export kit.

## Pinned path C: Tangram Tales (T-105)

`games/tangram-tales/artifact/` contains 47 selected, unmodified QLOBE files from commit `60967634e6cc313c41a5aa8067bed9f0f616176c`, including MIT LICENSE. `sources.lock.json` records upstream paths, Git blob hashes and SHA-256; `pnpm check` checks every retained byte. The handoff launcher was reviewed but not executed: only the selected pinned files were fetched and verified outside the repo. Normal builds are offline.

`games/tangram-tales/build.mjs` copies that artifact and applies a bounded guided-mode port plus `session.js`/`session.css`/English HTML to `public/games/tangram-tales/`; the upstream English copy is kept. The served engine omits debug, free play, shelf, storage, narration and idle prompting. The original 16 silhouettes, shape-family equivalence, target geometry and snapping remain. Native buttons use select-then-place input, including keyboard activation; orientation snaps automatically. Drag/hold rotation is omitted from this simplified guided version. Controls fit the phone iframe and landscape iPad; no race between pointer-up replacement and compatibility click.

The manifest specifies logic .7 / motor .3, age 6+, three levels. Levels leave 4/5/6 pieces to place, selected deterministically by the issued seed. A session selects four distinct silhouettes from the 16. **Round = one fully assembled silhouette confirmed with "Check".** Check while incomplete reports one mistake; completing after one or more failed checks reports exactly one correction. Selection, failed placement and rotation never count as rounds/mistakes. Four rounds produce exactly one finish; pagehide/unmount stops without finishing. All timing is elapsed monotonic time, with no family timezone dependency.

`tangram.spec.ts` covers a failed check → correction → four silhouettes → one persisted reward and idempotent receipt replay, stopping, levels 1/2 and repeated mistakes with one correction; level 3 is covered by conformance/reward tests. All run on Chromium/WebKit at phone and landscape iPad sizes. No debug/win helper or programmatic game-state mutation is used.

## Learning batch and Explore previews

The registry now contains seven scored games: Odd One Out, Continue the Pattern, Picture Puzzle, Tangram Tales, Mirror Grid (`reflection`), Rhythm Copycat and Secret Message Lab (`secret-message-copy`). The last three use four-task sessions and three levels. Their manifests are the source of truth for ages and weights.

Mirror Grid retains Sugarizer's local EaselJS rendering and reflection exercise in a standalone session shell; journal/server/home dependencies are removed. Rhythm and Secret Message use simplified QLOBE sessions with retained local artwork/audio. All three report failed checks, completed tasks and one correction for each completed task with previous mistakes. Feedback locks prevent repeated clicks from completing a task twice. Exit destroys the iframe without a finish.

`packages/game-catalog/src/previews.ts` separately validates `preview.json` for Magnet Explorer and Neighborhood Route Planner. These run at `/explore/<id>`, accessible through a secondary link below Learn. They are excluded from the learning catalog, database game seed and learning sessions. Their bridge accepts lifecycle messages only. The host never issues or finishes a scored session; real-input acceptance tests compare wallet, skills and stats before/after and reject session requests. Exit messages check origin, iframe source and game ID. Unmount removes the iframe and its audio/timers; camera and microphone are denied.

Prefer iPad landscape (1180×820) for design review; retain phone regression checks. Learning acceptance uses real controls, one failed check followed by a correction, four tasks, one saved receipt and idempotent replay. Conformance loads all seven learning games at `/lab`, checks ready within ten seconds, one finish, no console errors and no foreign requests. Preview specs exercise drawing/dragging and exit without fabricated completion events.

For future imports, start with an unchanged pinned game in Explore: retain its language and visual design, remove external services/debug entry points, add only lifecycle/exit handling and test iPad controls. Promote only the best candidates to Learn after implementing genuine attempt/completion hooks. Generic open/close activity is not evidence of skill improvement or a completed learning round. See [external-games.md](../product/external-games.md).

## Master integration (T-112 / T-113)

All seven scored manifests feed the React/embedded registry, Learn, live-history recommendations,
launch routes and DB seed. New imports have three levels and four completed tasks per session:
Tangram 6+ (logic .7 / motor .3), Mirror Grid 7+ (logic .7 / attention .3),
Rhythm 5+ and Secret Message 6+ (memory .7 / attention .3). The session API checks
minimum age as well as enabled status; catalog cards and Explore direct launches respect age locks.
Explore participates in shared state loading but never issues a learning session or grants rewards.

The platform is English-only (D-34): catalog titles, host loading/error text and every game's
in-game copy are English, and the bridge handshake carries `locale: "en"`. Explore previews keep
their original English gameplay with an English host bar.
The original pinned bytes and licenses are unchanged; only host/session code and served build
transforms are adapted. Stable button hit areas keep visual feedback from moving input targets.

`games-integration.spec.ts` covers the new games' English host flow, calculated skill gains,
saved history recommendations, parent progress, next-level launch, age locks
and iframe timeout/reload recovery, alongside the imported real-input conformance and replay tests.

Publishing this merge requires an application rebuild/redeploy and adding the missing catalog
rows with the non-reset seed command (`pnpm db:seed`) against the intended deployment database.
This integration does not run that command against production. Do not use `db:reset` or the
shared-family refresh to install game catalog entries. Unimported titles in
[the remaining queue](../product/external-games.md) stay unregistered and unavailable to children.

## Auto-discovery, thumbnails and Explore metadata (#8, D-38)

A game registers by existing: `scripts/discover-games.mjs` reads every `packages/games/src/<id>/manifest.json`, `games/<id>/manifest.json` (scored) and `games/<id>/preview.json` (Explore) and writes the gitignored registry modules the catalog imports. Shared scripts name no game.

New game checklist (only its folder):
- React: `manifest.json`, `index.ts` that **default-exports** its `GameDefinition`, `thumbnail.svg`.
- Embedded: `manifest.json` or `preview.json`, `build.mjs` exporting `buildGame(destination)` (optional `checkAssets(base)`), `thumbnail.svg`, `CREDITS.md`/licences.
- `thumbnail` is always `/games/<id>/thumbnail.svg`: 4:3 (`viewBox="0 0 160 120"`), ≤ 8 KB, `#F2F1FA` canvas with a 1 px `#E6E4F2` frame (`rx` 18), `GAME_PALETTE` shapes showing the actual mechanic, no text, no Brainy, nothing external.
- Previews add `explore`: `family` (`phaser` | `qlobe` | `sugarizer` | `h5p` | `blockly`), `viewport` (`responsive`, or `contain` with `aspectRatio` like `"4 / 3"`), `orientation`, `audio`, `readiness` (`bridge`, or `load` for games without the bridge).
- E2E: add the spec name to `HEAVY_GAME_SPECS`/`GAME_SPECS` in `apps/web/playwright.config.ts`.

GSP Phaser games (Shape Pairs, Color Boxes, Sticker Scene) share `packages/engine-phaser`, which carries GSP `phaser-core`'s helpers as `@brainee/engine-phaser/<module>`.

## Lavender palette (T-141)

Host chrome uses `--game-*` aliases from `@brainee/ui/styles.css`. Canvas consumers can import `GAME_PALETTE` from `@brainee/ui/lib/game-palette`; `pnpm check:palette` prevents drift from the light UI reference. CSS aliases follow the derived dark theme. Pair colors with shapes or words for correct/retry feedback. Pinned game artwork stays unchanged; this redesign does not modify game internals.

## Remote games (R2)

D-42 implements path C without committing game artifacts or rebuilding the host. GSP's driver-id/key model and folder/ZIP publishing flow are ported; its PECS API is not used. The publisher is an operator CLI, not an unauthenticated upload endpoint. Run only one publisher against a catalog at a time. Keep the catalog and old version objects for rollback; do not delete historical records manually.

A build folder (or ZIP with no enclosing directory) contains `manifest.json`, `index.html`, a thumbnail, scripts, assets and LICENSE/CREDITS. All runtime references must be relative, with no external fonts, API, analytics or CDN. Use simple ASCII filenames: letters, digits, underscore, dot and hyphen. No symlinks, absolute paths or traversal. HTML/CSS/SVG references are checked for missing and foreign assets; dynamic JavaScript assets still need browser conformance. The CSP blocks external requests, frames, forms and workers. Scripts must be separate files (no inline scripts/eval); inline styles are allowed for engine layouts. SVG thumbnails use the existing small self-contained 4:3 policy; PNG/WebP thumbnails have signature and 256 KiB size checks. Authors must verify raster dimensions and appearance at phone/iPad widths.

An unscored manifest uses the existing preview schema plus `source: "remote"`, `scored: false`, and a semantic `version`. Its `entry` is `/g/<id>/<version>/index.html`, and `thumbnail` names an SVG, PNG or WebP file under the same version prefix (for example `/g/<id>/<version>/thumbnail.webp`). Include `mode: "explore"`, title, minAge, license, sizeBudgetBytes and `explore` (family, viewport, orientation, audio, readiness; contained viewports also need aspectRatio). Scored builds use the learning manifest schema with `source: "remote"`, `scored: true`, `runtime: "embedded"`, skills/weights, levels, roundsPerSession and bridge contract `<id>@1`. Scoring metadata stays constant across versions of a game id; use a new id for changed rules. Built-in ids are reserved.

For a drop-in bridge, copy the locally built `apps/web/public/games/bridge.js` into the build and load `<script src="bridge.js" data-contract="your-id@1"></script>`. It sends ready after document load. Engines that load assets asynchronously should connect and send ready only after their scene is usable. Protocols 2 and 1 use the existing repeat-hello, nonce and private MessageChannel; the host accepts an opaque sender origin (`null`) only through its iframe window check. Scored games report genuine round events and one GameResult, never rewards. Explore accepts lifecycle only: no sessions, analytics, wallet writes or fabricated completion.

Remote frames have **only `allow-scripts`**, enforced again by the response CSP even when opened directly. `localStorage`, IndexedDB, cookies and parent DOM access are unavailable; catch storage errors or use in-memory state. Module scripts/fetch/images load through credential-free CORS on the same version prefix. No service workers, popups, camera/microphone or form submission. Built-in sandbox permissions are unchanged.

```sh
pnpm games:publish /path/to/build --driver fs
pnpm games:publish /path/to/build.zip --version 1.2.0 --driver r2
pnpm games:publish my-game --disable --driver r2
pnpm games:publish my-game --enable --driver r2
pnpm games:publish my-game --rollback 1.1.0 --driver r2
```

The CLI computes each file's SHA-256, uploads immutable files, then replaces `catalog.json`. Matching reruns are idempotent; changed bytes under an existing version fail. `--version` updates the manifest's versioned URLs. Disabled versions stay stored. Rollback enables only the selected version; enable chooses the currently enabled version or the last published one. ZIPs are limited to 32 MiB compressed and all builds to 64 MiB unpacked plus their manifest budget.

The server caches the remote catalog for ~60 seconds, merging enabled scored games into Learn/entry and unscored games into Explore. Open lists poll every 60 seconds, so a list may take roughly two intervals to converge; direct launches and session authorization consult the server cache. Lazy database sync runs before remote starts/finishes, without publishing scripts needing database credentials. Existing core age, result, replay and reward checks apply. Version objects have one-year immutable caching; disable cannot erase files already cached by a browser. An existing scored receipt can still be replayed without awarding twice.

Local standalone proof (no game files enter git):

```sh
node scripts/prepare-remote-sample.mjs
pnpm games:publish .local/remote-shape-match --driver fs
# Optional, with authorized server credentials in .env.r2:
pnpm games:publish .local/remote-shape-match --driver r2
pnpm build
BRAINEE_E2E_PORT=3301 pnpm --filter @brainee/web exec playwright test remote-game --project=webkit-ipad
```

The preparation script copies GSP's `public/builds/phaser-shape-match-game` into ignored local storage, changes exactly one bridge tag from `game-store` to `brainee`, adds the manifest/thumbnail/credits and preserves gameplay. Select Shape Match (Remote) at `/lab`, or open it from `/explore`. The focused heavy spec verifies readiness, canvas input, opaque storage/parent restrictions, unchanged wallet/skills and zero foreign requests at iPad/phone widths. It can run alone without `e2e:full`; it skips when the external sample has not been published. `node --test scripts/publish-games.test.mjs` checks publishing; catalog/storage and scored DB behavior have workspace unit tests.
