# TODO

Task IDs are stable; reference them in commits and in the log. Tick `[x]` when done, and add `(@who)` while working on something. Specs are linked, not copied.

## P0 · Docs & planning
- [x] T-01 Analyze the PRD and prototype
- [x] T-02 Pick the stack and monorepo layout → [decisions.md](../dev/decisions.md)
- [x] T-03 Condense the PRD into `docs/product/`
- [x] T-04 Set up agent docs (AGENTS/CLAUDE/GEMINI) and progress tracking
- [x] T-05 Map prototype functions to line numbers → [ideas/README.md](../ideas/README.md)

## P1 · Scaffold monorepo
- [x] T-10 pnpm workspaces + Turborepo + `packages/config` (tsconfig, Biome, Tailwind), JIT internal packages
- [x] T-11 `apps/web` Next.js 16 with `(child)`, `(parent)`, `(auth)` route groups
- [ ] T-12 `packages/ui`: port tokens + fonts via `next/font` (prototype lines 7–285)
- [ ] T-13 Empty `core`, `brainy`, `games`, `db` packages with Vitest; `db` on SQLite (`data/dev.db`) + `db:reset`
- [ ] T-14 Deploy one container to Railway (volume for SQLite) on a custom domain → [setup.md](../dev/setup.md#deploy-demo)
- [x] T-15 Update [setup.md](../dev/setup.md) and the AGENTS.md Commands section with the real commands (extend as app, DB and game scripts land)
- [ ] T-16 Dev-only `/lab` route: game picker, level/seed, phone/iPad frame, event stream panel (`data-status`) → [games.md](../dev/games.md#lab)
- [ ] T-17 `pnpm gen:game` Turborepo generator
- [ ] T-18 Install the curated agent skills → [agent-tooling.md](../dev/agent-tooling.md)
- [ ] T-19 `pnpm games:build` + `pnpm test:assets` (port GSP `build-packages.mjs`, `verify-game-assets.mjs`); `db:seed` reads `games/*/manifest.json` into `Game`

## P2 · Core logic + Brainy · [mechanics.md](../product/mechanics.md)
- [ ] T-20 `packages/brainy`: port `brainy(s, id, acc)` to typed SVG/React (lines 671–733)
- [ ] T-21 Star rules (+3 / +4 / +15 / 3-in-a-row +5) with tests
- [ ] T-22 Exchange ☀→★ 1:10, one-way; gifts ☀ only
- [ ] T-23 Stage + mood math (stage thresholds, +8 mood per game)
- [ ] T-24 Stat gain from a session (70/30 weights; keep the formula swappable)
- [ ] T-25 Entry recommendation algorithm (3 largest gaps, least-played in 7 days)
- [ ] T-26 Weekly goal counted by week_suns; 5-tasks-a-day limit
- [ ] T-27 Accessory slots (one per slot; earned vs. bought)
- [ ] T-28 Game contract: `GameResult`/`Skill` types in `core`, `GameDefinition` + lazy registry + error boundary in `games`; `pnpm check:games` (no cross-game imports) → [games.md](../dev/games.md)
- [ ] T-29 Port GSP `bridge-core` → `packages/game-bridge` (drop PECS parts, global `Brainee`) + `engine-phaser` / `engine-gdevelop` kits + `IframeGame` and host hook in `GameHost` → [games.md](../dev/games.md#bridge-embedded-games-port-gsp-packagesbridge-core)

## P3 · Child flow · [screens.md#child](../product/screens.md#child)
- [ ] T-30 Brainy dock + child tab bar
- [ ] T-31 Entry screen (no close, logs the choice)
- [ ] T-32 Learn tab (recommendations + grid)
- [ ] T-33 Game: Odd one out (2 levels × 4 rounds), tested at `/lab`
- [ ] T-34 Game: Continue the pattern
- [ ] T-35 Post-game screen: before → after, "Что дальше?", break after 3
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
- [ ] T-51 Seeds: demo family, scenarios "после квиза / сейчас / только развлечения"
- [ ] T-52 Demo session (`DEMO_MODE`, seeded family) + parent PIN barrier; Better Auth = stretch goal
- [ ] T-53 Onboarding quiz → starting stats
- [ ] T-54 API: session finish → core → db
- [ ] T-55 SSE live updates to both UIs (in-process event bus)

## P6 · PWA + allowlist · [rules.md](../product/rules.md#device-lockdown)
- [ ] T-60 Serwist PWA manifest + icons + offline shell
- [ ] T-61 Audit: zero foreign-domain requests (DevTools network)
- [ ] T-62 Test on an iPad with Screen Time "Allowed Websites Only"
- [ ] T-63 Onboarding wizard for setting up the allowlist (stretch goal)

## P7 · Demo & pitch
- [ ] T-70 Walk through the [acceptance criteria](../product/rules.md#mvp-acceptance-criteria) (Playwright) + web-design-guidelines audit
- [ ] T-71 Two-device demo script (child iPad + parent phone)
- [ ] T-72 Landing page (`apps/landing`), stretch goal
- [ ] T-73 Pitch deck
- [ ] T-74 Freeze `master`, tag the demo build

## Backlog / ideas
- [ ] T-80 Define a smallest end-to-end demo slice and prioritize it ahead of optional features.
- [ ] T-81 Specify server-side result validation, idempotency and atomic wallet/task updates.
- [ ] T-82 Define demo versus production boundaries for sessions, parent PIN, child data and backups.
- [ ] T-83 Resolve reward incentives and clarify the evidence and labels for skill scores, age averages and seeded rankings.
- [ ] T-84 Validate the own-domain PWA and two-device sync on a real iPad early; define offline behavior and source licensed demo media.
- [ ] T-85 Port one GSP game end to end (suggest `phaser-shape-match-game`): engine kit, Russian UI, manifest, bridge events → `GameResult`, Chromium + WebKit e2e. Other candidates in [games.md](../dev/games.md#reusable-gsp-games-candidates)
- Additional learning games (Sounds & letters, Repeat after Brainy, Magic garden, Expedition, Error detective)
- Fun games beyond the first one
- Push notification on `stage_up`
