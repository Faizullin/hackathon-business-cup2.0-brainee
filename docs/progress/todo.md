# TODO

Task IDs are stable; reference them in commits and in the log. Tick `[x]` when done, and add `(@who)` while working on something. Specs are linked, not copied.

## Smallest end-to-end demo slice (T-80)
**Proof:** the child opens Learn, finishes a game, sees ★ and Brainy change, then the parent sees the same saved result on another device without reloading. Use one seeded family and two React games; no onboarding or shopping is needed.

**Exact task scope:**
- Completed foundations: T-10, T-11, T-12, T-13, T-15, T-16, T-20, T-21, T-23, T-28, T-30, T-33.
- Child flow: T-34 (second game) and T-35 (before/after, next choices, stop and three-game break).
- Shared data: T-50 (Parent/BrainyState/Game/GameSession + existing wallet slice), T-51 (one deterministic demo scenario), T-52 (seeded family session), T-54 (finish → core → atomic DB write), T-81 (validate and deduplicate finishes), T-55 (versioned state polling on both devices).
- Parent proof: T-40 (PIN barrier) and T-41 (Brainy, balance and latest completed game).
- Verification/demo: T-70 (this slice's Playwright checks) and T-71 (two-device walkthrough).

**Done when:** one finish updates balance/stats once, retrying it pays nothing twice, both devices converge through polling, and the third game offers a break with exactly one bonus. Refresh restores server state. The client preview and saved-session APIs exist; UI polling and parent proof remain. Slice-only work does not complete broader tasks such as all T-41 analytics or all T-50 entities.

Other task IDs stay outside this slice. T-24/T-25 are available as pure core improvements; entry flow, tasks/gifts, leisure, advanced analytics, embedded games and motion polish wait. Deployment remains the final task (T-14).

## P0 · Docs & planning
- [x] T-01 Analyze the PRD and prototype
- [x] T-02 Pick the stack and monorepo layout → [decisions.md](../dev/decisions.md)
- [x] T-03 Condense the PRD into `docs/product/`
- [x] T-04 Set up agent docs (AGENTS/CLAUDE/GEMINI) and progress tracking
- [x] T-05 Map prototype functions to line numbers → [ideas/README.md](../ideas/README.md)

## P1 · Scaffold monorepo
- [x] T-10 pnpm workspaces + Turborepo + `packages/config` (tsconfig, Biome, Tailwind), JIT internal packages
- [x] T-11 `apps/web` Next.js 16 with `(child)`, `(parent)`, `(auth)` route groups
- [x] T-12 `packages/ui`: fonts via `next/font`; `shadcn init` with a Base UI (`base-*`) style restyled to the tokens; motion tokens; install Motion + Lucide; root layout without visual chrome → [ui.md](../dev/ui.md)
- [x] T-13 Empty `core`, `brainy`, `games`, `db` packages with Vitest; `db` on SQLite (`data/dev.db`) + `db:reset`
- [x] T-15 Update [setup.md](../dev/setup.md) and the AGENTS.md Commands section with the real commands (extend as app, DB and game scripts land)
- [x] T-16 Dev-only `/lab` route: game picker, level/seed, phone/iPad frame, event stream panel (`data-status`) → [games.md](../dev/games.md#lab)
- [ ] T-17 `pnpm gen:game` Turborepo generator
- [ ] T-18 Install the curated agent skills → [agent-tooling.md](../dev/agent-tooling.md)
- [ ] T-19 `pnpm games:build` + `pnpm test:assets` (port GSP `build-packages.mjs`, `verify-game-assets.mjs`); `db:seed` reads `games/*/manifest.json` into `Game`

## P2 · Core logic + Brainy · [mechanics.md](../product/mechanics.md)
- [x] T-20 `packages/brainy`: port `brainy(s, id, acc)` to typed SVG/React (lines 671–733); pure `brainyModel` + `<Brainy>`, presets, `/lab/brainy`
- [x] T-21 Star rules (+3 / +4 / +15 / 3-in-a-row +5) with tests
- [x] T-22 Exchange ☀→★ 1:10, one-way; gifts ☀ only
- [x] T-23 Stage + mood math (stage thresholds, +8 mood per game); mood decay rate is still a product TBD
- [x] T-24 Session skill gains (70/30), ability → body rollup; injected level/accuracy policy, calibration still TBD → [data-model.md](../product/data-model.md#how-stats-change)
- [x] T-25 Entry recommendation algorithm (3 largest gaps, least-played in 7 days); explicit age-average/history/time inputs → [screens.md](../product/screens.md#entry-screen-во-что-играем-сейчас)
- [ ] T-26 Weekly goal counted by week_suns; 5-tasks-a-day limit
- [x] T-27 Accessory slots (one per slot; earned vs. bought): catalog, `equip`/`unequip`, `buyAccessory` in `core`
- [x] T-28 Game contract: `GameResult`/`Skill` types in `core`, `GameDefinition` + lazy registry + error boundary in `games`; `pnpm check:games` (no cross-game imports) → [games.md](../dev/games.md)
- [ ] T-29 Port GSP `bridge-core` → `packages/game-bridge` (drop PECS parts, global `Brainee`) + `engine-phaser` / `engine-gdevelop` kits + `IframeGame` and host hook in `GameHost` → [games.md](../dev/games.md#bridge-embedded-games-port-gsp-packagesbridge-core)

## P3 · Child flow · [screens.md#child](../product/screens.md#child)
- [x] T-30 Child app shell: Brainy dock + 4-tab bottom bar in `(child)/layout`, fullscreen game layout, app-feel checklist → [ui.md](../dev/ui.md#app-shell-route-group-layouts-own-the-chrome)
- [ ] T-31 Entry screen (no close, logs the choice)
- [ ] T-32 Learn tab (recommendations + grid); the game grid exists, «Брейни советует» recommendations remain
- [x] T-33 Game: Odd one out (2 levels × 4 rounds, seeded), tested at `/lab` and in the child flow
- [x] T-34 Game: Continue the pattern (2 levels × 4 seeded rounds); both games share `kit/Shape`
- [x] T-35 Post-game screen: before → after, stat chip, "Что дальше?", stop, third-game break +5★; [per-tab preview](../dev/ui.md#temporary-learning-preview-t-35), no DB writes
- [ ] T-36 Leisure tab: shop (10 min / forever), cartoons, science videos
- [ ] T-37 Science video player (pause only, resume, quiz)
- [ ] T-38 Gifts tab + Brainy tab (accessory shop, stats, earned rewards)

## P4 · Parent flow · [screens.md#parent](../product/screens.md#parent)
- [ ] T-40 Parent barrier (PIN) + parent tab bar
- [ ] T-41 Analytics: Brainy hero + 4 metrics + insight
- [ ] T-42 Analytics: skill + character radars, weekly time bars (Recharts)
- [ ] T-43 Analytics: "Do the hard thing" chart, ranking (seeded), share card
- [ ] T-44 Tasks: form, templates, Today list, confirm, limit 5
- [ ] T-45 Tasks: recommendations from stats → "Назначить"
- [ ] T-46 Gifts & goal: weekly goal, gift CRUD, child requests → "Вручено"

## P5 · Data, auth, live sync · [data-model.md](../product/data-model.md)
- [ ] T-50 Drizzle SQLite schema for every entity
  - [x] Connected-demo subset: Parent, BrainyState, Game, GameSession, cookie access/run and family version; constraints + FK tests → [data-model.md](../product/data-model.md)
- [ ] T-51 Seeds: demo family, scenarios "после квиза / сейчас / только развлечения"
  - [x] One deterministic **now** scenario with quiz baseline, two games, hashed parent PIN and consistent history; reruns preserve progress
- [ ] T-52 Demo session (`DEMO_MODE`, seeded family) + parent PIN barrier; Better Auth = stretch goal
  - [x] Explicit opt-in, opaque HttpOnly cookie, hashed token, expiry, same-origin mutations; parent barrier remains T-40 → [sessions.md](../dev/sessions.md)
- [ ] T-53 Onboarding quiz → starting stats
- [x] T-54 API: issued game start/finish/stop → core → atomic saved state and receipt; UI integration is T-55 → [sessions.md](../dev/sessions.md)
- [ ] T-55 Live updates by short polling: `/api/state` version + TanStack Query (~3 s) in child and parent UIs → [D-15](../dev/decisions.md)

## P6 · PWA + allowlist · [rules.md](../product/rules.md#device-lockdown)
- [ ] T-60 Serwist PWA manifest + icons + offline shell
- [ ] T-61 Audit: zero foreign-domain requests (DevTools network)
- [ ] T-62 Test on an iPad: over LAN during development; with Screen Time "Allowed Websites Only" after T-14
- [ ] T-63 Onboarding wizard for setting up the allowlist (stretch goal)

## P7 · Demo & pitch
- [ ] T-70 Walk through the [acceptance criteria](../product/rules.md#mvp-acceptance-criteria) (Playwright) + web-design-guidelines audit
- [ ] T-71 Two-device demo script (child iPad + parent phone)
- [ ] T-72 Landing page (`apps/landing`), stretch goal
- [ ] T-73 Pitch deck
- [ ] T-74 Freeze `master`, tag the demo build
- [ ] T-14 **Final step: deploy (free tiers only)**: Vercel Hobby project for `apps/web` (monorepo root dir, `<project>.vercel.app`); Turso free database; extend `getDatabaseConfig`/`openDatabase` for `libsql://` + `DATABASE_AUTH_TOKEN`; `db:push` + seed against Turso; run the e2e suite against the deployed URL → [D-15](../dev/decisions.md)

## Backlog / ideas
- [x] T-80 Define a smallest end-to-end demo slice and prioritize it ahead of optional features → [scope above](#smallest-end-to-end-demo-slice-t-80).
- [ ] T-81 Specify server-side result validation, idempotency and atomic wallet/task updates.
  - [x] Session/result validation, concurrent replay protection, atomic wallet/Brainy/run/history/version and rollback tests → [sessions.md](../dev/sessions.md); task updates await T-44
- [ ] T-82 Define demo versus production boundaries for sessions, parent PIN, child data and backups.
- [ ] T-83 Resolve reward incentives and clarify the evidence and labels for skill scores, age averages and seeded rankings.
- [ ] T-84 Validate the PWA and two-device sync on a real iPad early over LAN (no deployment needed); define offline behavior and source licensed demo media.
- [ ] T-85 Port one GSP game end to end (suggest `phaser-shape-match-game`): engine kit, Russian UI, manifest, bridge events → `GameResult`, Chromium + WebKit e2e. Other candidates in [games.md](../dev/games.md#reusable-gsp-games-candidates)
- [ ] T-87 Motion polish: `<ViewTransition>` tab/push/pop + shared elements, ★ fly-to-wallet, animated counters, Brainy idle/stage-up, `loading.tsx` Brainy loader, reduced-motion spec → [ui.md](../dev/ui.md). After the functional flow works.
- [x] T-88 Port the local UI recording/report tooling from game-store-planning; generate phone/iPad walkthroughs with linked videos, screenshots and logs → [reports/README.md](../reports/README.md)
- [ ] T-89 Manifest schema (zod) for all games + CI validation: id, version, engine, runtime, entry, skills, levels, bridge protocol/contract, size budget, license → [games.md](../dev/games.md#scaling-three-paths-in-one-contract-d-16)
- [ ] T-90 Game conformance suite (Playwright, Chromium + WebKit): load, ready ≤ 10 s, one finish, zero foreign requests, size budget, no console errors; required before a game is listed
- [ ] T-91 (Later) External game artifacts (path C): `games:import <id>@<version>` with checksum, `GameVersion` table, enable/disable/rollback
- [ ] T-92 Retire the native libSQL patch and restore optional secondary indexes/email uniqueness after replacement driver/Kit versions pass the concurrency and repeated-push regressions → [D-19](../dev/decisions.md)
- [ ] T-93 Resolve WebKit's native mouse-coordinate failure on this Mac, then rerun the complete UI suite; a bare-button repro is in [setup.md](../dev/setup.md#webkit-pointer-diagnostics-t-93)
- Additional learning games (Sounds & letters, Repeat after Brainy, Magic garden, Expedition, Error detective)
- Fun games beyond the first one
- Push notification on `stage_up`
