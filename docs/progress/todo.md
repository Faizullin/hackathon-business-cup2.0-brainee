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

**Done when:** one finish updates balance/stats once, retrying it pays nothing twice, both devices converge through polling, and the third game offers a break with exactly one bonus. Refresh restores server state. Saved child progression, retry recovery, PIN access and parent polling exist; presentation rehearsal is documented in [demo.md](../demo.md). Slice-only work does not complete broader tasks such as all T-41 analytics or all T-50 entities.

Other task IDs stay outside this slice. T-24/T-25 are available as pure core improvements; entry flow, tasks/gifts, leisure, advanced analytics, embedded games and motion polish wait. Deployment remains the final task (T-14).

## Road to MVP (acceptance criteria → remaining tasks)
Criteria live in [rules.md](../product/rules.md#mvp-acceptance-criteria). The MVP is a **presentation build**: every page exists with basic saved interactions; activity analytics are live; historical/character radars and ranking remain seeded (D-29). Status on 2026-11-14:

| # | Criterion | State |
|---|---|---|
| 1 | Entry screen, no close, 3 games by gap, choice logged | ✅ demo (T-31/T-32; age averages illustrative, T-83) |
| 2 | Post-game before → after, two next steps, stop; 3-game break + bonus | ✅ (T-35, T-94) |
| 3 | Stats/stage update for child **and parent** without reload | ✅ polling on both (T-55; e2e two-device check) |
| 4 | Accessories buy/wear/remove, shown everywhere | ✅ (T-38) |
| 5 | Science video: pause only, resume, ★ only after correct answer | ✅ demo player, no real media (T-37, T-84) |
| 6 | Task «Готово» → parent confirms → ☀ + weekly goal + `resp` | ✅ (T-44) |
| 7 | Gifts ☀ only; exchange ☀ → ★ 1:10 | ✅ (T-38, T-46) |
| 8 | 5-tasks-a-day limit | ✅ (T-26/T-44) |
| 9 | Ranking hidden from child, no last names | ✅ parent-only, initials (T-43) |
| 10 | Own-domain only; works with Screen Time allowlist | Automated route audit + PWA done; physical Screen Time verification remains T-62 |

**Left before freeze:** T-113 imported-game input stabilization and full browser rerun → T-115 English in-game instructions → owner T-62/T-84 physical iPad rehearsal using [demo.md](../demo.md) → owner builds the deck from [pitch.md](../pitch.md) → T-74 freeze/tag. Games are merged; this session does not deploy.

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
- [x] T-19 `pnpm games:build` + `pnpm test:assets` (port GSP `build-packages.mjs`, `verify-game-assets.mjs`); `db:seed` reads `games/*/manifest.json` into `Game`

## P2 · Core logic + Brainy · [mechanics.md](../product/mechanics.md)
- [x] T-20 `packages/brainy`: port `brainy(s, id, acc)` to typed SVG/React (lines 671–733); pure `brainyModel` + `<Brainy>`, presets, `/lab/brainy`
- [x] T-21 Star rules (+3 / +4 / +15 / 3-in-a-row +5) with tests
- [x] T-22 Exchange ☀→★ 1:10, one-way; gifts ☀ only
- [x] T-23 Stage + mood math (stage thresholds, +8 mood per game); mood decay rate is still a product TBD
- [x] T-24 Session skill gains (70/30), ability → body rollup; injected level/accuracy policy, calibration still TBD → [data-model.md](../product/data-model.md#how-stats-change)
- [x] T-25 Entry recommendation algorithm (3 largest gaps, least-played in 7 days); explicit age-average/history/time inputs → [screens.md](../product/screens.md#entry-screen-во-что-играем-сейчас)
- [x] T-26 Weekly goal counted by confirmed ☀; 5-tasks-a-day limit (`applyShowcaseAction`, D-21)
- [x] T-27 Accessory slots (one per slot; earned vs. bought): catalog, `equip`/`unequip`, `buyAccessory` in `core`
- [x] T-28 Game contract: `GameResult`/`Skill` types in `core`, `GameDefinition` + lazy registry + error boundary in `games`; `pnpm check:games` (no cross-game imports) → [games.md](../dev/games.md)
- [x] T-29 Port GSP `bridge-core` → `packages/game-bridge` (protocol 2/1, no PECS, global `Brainee`) + `engine-phaser`, generic GDevelop adapter, `IframeGame` and embedded `GameHost` (GDevelop export kit deferred) → [games.md](../dev/games.md#bridge-embedded-games-port-gsp-packagesbridge-core)

## P3 · Child flow · [screens.md#child](../product/screens.md#child)
- [x] T-30 Child app shell: Brainy dock + 4-tab bottom bar in `(child)/layout`, fullscreen game layout, app-feel checklist → [ui.md](../dev/ui.md#app-shell-route-group-layouts-own-the-chrome)
- [x] T-31 Entry screen `/entry` (no close, logs the choice; `/` redirects here)
- [x] T-32 Learn tab: «Брейни советует» (T-25 + top-up for the 2-game catalog) + grid
- [x] T-33 Game: Odd one out (2 levels × 4 rounds, seeded), tested at `/lab` and in the child flow
- [x] T-34 Game: Continue the pattern (2 levels × 4 seeded rounds); both games share `kit/Shape`
- [x] T-35 Post-game screen: before → after, stat chip, "Что дальше?", stop, third-game break +5★; now uses [saved learning state](../dev/ui.md#saved-learning-state-t-55)
- [x] T-36 Leisure tab: shop (10 min / forever), cartoons, science videos (fun games/cartoons have no content yet)
- [x] T-37 Science video player `/video/[id]` (pause only, resume, quiz; animated placeholder, no media)
- [x] T-38 Gifts tab + Brainy tab (accessory shop, stats, earned rewards)

## P4 · Parent flow · [screens.md#parent](../product/screens.md#parent)
- [x] T-40 Parent barrier (PIN 1234, server-checked per device) + parent tab bar
- [x] T-41 Analytics: Brainy hero (live) + 4 metrics + insight (seeded, D-21)
- [x] T-42 Analytics: skill + character radars, weekly time bars (hand-rolled SVG, seeded)
- [x] T-43 Analytics: "Do the hard thing" chart, ranking (seeded), share card
- [x] T-44 Tasks: form, templates, Today list, confirm, limit 5
- [x] T-45 Tasks: recommendations (seeded) → "Назначить"
- [x] T-46 Gifts & goal: weekly goal, gift add/remove, child requests → "Вручено"

## P5 · Data, auth, live sync · [data-model.md](../product/data-model.md)
- [ ] T-50 Drizzle SQLite schema for every entity
  - [x] Connected-demo subset: Parent, BrainyState, Game, GameSession, cookie access/run and family version; constraints + FK tests → [data-model.md](../product/data-model.md)
- [ ] T-51 Seeds: demo family, scenarios "после квиза / сейчас / только развлечения"
  - [x] One deterministic **now** scenario with quiz baseline, two games, hashed parent PIN and consistent history; reruns preserve progress
- [ ] T-52 Demo session (`DEMO_MODE`, seeded family) + parent PIN barrier; Better Auth = stretch goal
  - [x] Explicit opt-in, opaque HttpOnly cookie, hashed token, expiry, same-origin mutations; parent barrier implemented in T-40 → [sessions.md](../dev/sessions.md)
- [x] T-53 Onboarding quiz → starting stats
- [x] T-54 API: issued game start/finish/stop → core → atomic saved state and receipt; child UI wired through T-55 → [sessions.md](../dev/sessions.md)
- [x] T-55 Live updates by short polling: `/api/state` version + TanStack Query (~3 s) in child and parent UIs → [D-15](../dev/decisions.md)
  - [x] Cookie-authorized snapshot, child polling, issued-game UI, confirmed rewards, finish retry/reload and other-device sync → [sessions.md](../dev/sessions.md#shared-state-and-client-recovery-t-55), D-20
  - [x] Parent consumer; child ↔ parent sync verified in `mvp-pages.spec.ts`

## P6 · PWA + allowlist · [rules.md](../product/rules.md#device-lockdown)
- [x] T-60 PWA manifest + generated icons (`/manifest.webmanifest`, `/icon`, `/apple-icon`), standalone, theme colors; offline shell not needed for the demo
- [x] T-61 Automated own-origin audit across all pages, both games, four videos, lab and PWA assets (`own-origin.spec.ts`); physical allowlist remains T-62
- [ ] T-62 Test on an iPad: over LAN during development; with Screen Time "Allowed Websites Only" after T-14
- [x] T-63 Onboarding setup: pairing code and current-domain Screen Time instructions (physical verification remains T-62)

## P7 · Demo & pitch
- [x] T-70 Presentation acceptance walk and visual review → [evidence and remaining boundaries](../demo.md#acceptance-walk-t-70); expanded accessory, child-ranking and video-resume checks
- [x] T-71 Reset-first two-device demo script (child landscape iPad + parent phone) → [demo.md](../demo.md)
- [ ] T-72 Landing page (`apps/landing`), stretch goal
- [x] T-73 Pitch support: ten-slide outline and three-minute US-first script → [pitch.md](../pitch.md); owner assembles the deck
- [ ] T-74 Freeze `master`, tag the demo build
- [x] T-14 **Deploy (free tiers only)**: Turso cloud database provisioned and seeded (`libsql://brainee-demo-...`); `packages/db` updated with `DATABASE_AUTH_TOKEN` support; Vercel Next.js project deployed and live at `https://brainee.vercel.app` → [D-15](../dev/decisions.md)

## Backlog / ideas
- [x] T-80 Define a smallest end-to-end demo slice and prioritize it ahead of optional features → [scope above](#smallest-end-to-end-demo-slice-t-80).
- [ ] T-81 Specify server-side result validation, idempotency and atomic wallet/task updates.
  - [x] Session/result validation, concurrent replay protection, atomic wallet/Brainy/run/history/version and rollback tests → [sessions.md](../dev/sessions.md); showcase task actions implemented in T-44 (D-21)
- [ ] T-82 Define demo versus production boundaries for sessions, parent PIN, child data and backups.
- [ ] T-83 Resolve reward incentives and clarify the evidence and labels for skill scores, age averages and seeded rankings.
- [ ] T-84 Validate the PWA and two-device sync on a real iPad early over LAN (no deployment needed); define offline behavior and source licensed demo media.
- [x] T-85 Port GSP Picture Puzzle end to end: Phaser kit, local CC0 art/licences, Russian host, manifest, four-placement `GameResult`, issued-session rewards and Chromium/WebKit e2e. Other candidates in [games.md](../dev/games.md#reusable-gsp-games-candidates)
- [x] T-87 Motion polish: `<ViewTransition>` tab/push/pop + shared elements, ★ fly-to-wallet, animated counters, Brainy idle/stage-up, `loading.tsx` Brainy loader, reduced-motion spec → [ui.md](../dev/ui.md). After the functional flow works.
- [x] T-88 Port the local UI recording/report tooling from game-store-planning; generate phone/iPad walkthroughs with linked videos, screenshots and logs → [reports/README.md](../reports/README.md)
- [x] T-89 Light manifest schema (zod) for all listed games + `pnpm check` validation: id, version, engine, runtime, entry, skills, levels, bridge protocol/contract, size budget, license → [games.md](../dev/games.md#scaling-three-paths-in-one-contract-d-16)
- [x] T-90 Game conformance suite (Playwright, Chromium + WebKit): load, ready ≤ 10 s, one finish, zero foreign requests, size budget, no console errors; required before a game is listed
- [ ] T-91 (Later) External game artifacts (path C): `games:import <id>@<version>` with checksum, `GameVersion` table, enable/disable/rollback
- [ ] T-92 Retire the native libSQL patch and restore optional secondary indexes/email uniqueness after replacement driver/Kit versions pass the concurrency and repeated-push regressions → [D-19](../dev/decisions.md)
- [x] T-94 Post-game «Подтянуть навык» card should prefer a different game than the one just played (the report shows it repeating Odd one out next to its own next-level card) → [screens.md](../product/screens.md#game-screen-and-no-exit-flow)
- [x] T-98 iPad landscape layout (1180 × 820): left tab rail, dock as side column, two-column Brainy tab; portrait-tablet rotate hint; e2e/report iPad viewport switched to landscape
- [x] T-100 Per-game skill weights + ability scores → body (D-23); minimum age per game, locked cards, age-aware recommendations (D-22)
- [x] T-101 Onboarding quiz before signup (`/onboarding`), own minimal accounts, parent login, demo account, 15-min PIN, «Вернуть ребёнку» (D-24)
- [x] T-102 ROUTES.md extras: «Требует внимания», event feed, mood decay on read, live-skill radar (D-25)
- [x] T-103 ROUTES.md follow-ups: tab badges, task cancel, bonus once per day + daily/weekly resets, parent Settings (child, PIN change, devices), device pairing code, adult-task gate fallback → [routes-spec.md](../product/routes-spec.md)
  - [x] Tab badges from shared state (assigned real tasks / confirmations / undelivered gifts), hidden parent counts while locked; cancel assigned tasks with parent authorization and no rewards.
  - [x] Daily bonus shared across devices; family-local daily/weekly rollover, fresh task quota and read-only task history (D-26).
  - [x] Settings (child, PIN, timezone, devices/account), one-time pairing/revocation, adult-task fallback; stage celebration/feed and task empty states.
  - [x] Onboarding polish: progress, answer reactions, story, hold/reduced-motion reveal and optional referral field.
- [x] T-104 English locale `en.ts` + locale switch (D-22), before English-only external games
- [x] T-110 US-English seeds and demo family (Mia, `mom@example.com`, US names/numbers, New York time), RU display map for seeded content and game titles, `db:refresh-demo`, report locale cookie/timezone fix (D-30)
- [x] T-111 English WebKit MVP/learning recordings, English child/parent e2e and Russian smoke; localized Brainy/lab/manifest, report cookie/timezone checks (D-30/D-31)
- [x] T-112 English manifest titles and localized `GameHost`/`IframeGame` loading/errors, Russian catalog/feed translations and locale handshake.
- [x] T-105 First external game via path C: Tangram Tales → [external-games.md](../product/external-games.md)
- [ ] T-106 Port the GSP GDevelop export/build kit when the first GDevelop title is selected; the generic bridge adapter is already available (T-29).
- [x] T-99 Manual run fix: Turborepo dropped `DEMO_MODE` (strict env) → `globalPassThroughEnv`; `pnpm demo` one-command run
- [x] T-96 `mvp` report module: every page + child → parent walkthrough; `scaffold` report retired → [reports/mvp.md](../reports/mvp.md)
- [ ] T-97 Showcase follow-ups after the pitch: real Task/Gift/Request tables, computed analytics, playable fun games and cartoons, presenter «Сбросить демо» button (endpoint exists)
- [x] T-95 `learning` report module: phone/iPad recordings of the saved three-game loop, break, tabs and `/lab` → [reports/learning.md](../reports/learning.md)
- [x] T-93 Restore complete WebKit UI verification with normal clicks: the full suite passes at phone/iPad widths; the earlier coordinate failure no longer reproduces, with its cause unconfirmed. Keep the [diagnostic repro](../dev/setup.md#webkit-pointer-diagnostics-t-93) if it recurs.
- Additional learning games (Sounds & letters, Repeat after Brainy, Magic garden, Expedition, Error detective)
- Fun games beyond the first one
- Push notification on `stage_up`

- [x] T-107 One-tap isolated jury families, root role chooser, neutral simple signup and post-signup device setup (D-29).
- [x] T-108 History-based recommendations, automatic app tasks, live activity analytics and earned rewards with progress/celebrations/feed (D-29).
- [x] T-109 Playable Snake with saved active-time credit/top-ups/forever and restart-from-zero cartoon placeholder (D-29).

- [ ] T-113 Finish serial WebKit input stabilization and complete browser verification after master integration: Tangram acceptance, Rhythm Copycat, Secret Message Lab, Mirror Grid; Neighborhood and Magnet previews.
- [ ] T-114 Remaining external game waves; see external-games.md.

- [ ] T-115 Translate imported scored-game instructions and controls into English while retaining Russian; host/catalog localization is complete in T-112.

## Redesign (D-35, D-36, D-37) → [plans/redesign.md](../plans/redesign.md)

- [x] T-130 Dropped: no dictionary refactor; new copy English-only in feature modules, existing translations untouched (D-37)
- [x] T-131 Lavender tokens remapped onto existing names, Manrope titles + Unbounded numerals, Lucide 2 px, motion classes, derived dark set; update ui.md (D-36)
- [x] T-132 **Brainy = port of the design's Brain component** (energy=mood, stage size, stat-driven parts, kid-safe effects, re-anchored accessories, rAF only on heroes) (D-36)
- [x] T-133 `packages/core/src/funnel.ts`: funnel logic + `funnelQuizAnswers` mapping, tested
- [x] T-134 `StepPage` + `AnswerGroup` components (two-column iPad landscape)
- [ ] T-135 Parent funnel at `/start` → signup → setup; `/onboarding` redirects; pricing pending, no checkout
- [ ] T-136 Family plan: `showcase.familyPlan`, parent card, phrase on the child's stopping point, off-screen task template
- [ ] T-137 Demo moments: funnel-local shape-match step (no game code, no session/rewards), real-stage growth slider
- [ ] T-138 Restyle product pages from [design.md](../product/design.md) patterns
- [ ] T-140 Child shell: dark hero brain card + tab bar Learn · Leisure · [Brainy hub] · Path · Gifts; new Path tab
- [ ] T-141 Game palette tokens `--game-*` / `GAME_PALETTE` + host chrome (game folders out of scope)
- [ ] T-142 Parent patterns: Today/Week cards, needs-attention actions, earned breakdown
- [ ] T-139 Docs, full serial e2e, re-record reports after T-135–T-138
