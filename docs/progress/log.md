# Log

Append-only, **newest first**. One entry per session, 2–5 lines. Reference task IDs.

---

## 2026-11-14 (films: props stand on the ground, T-110)
- Feedback: props looked like they were flying. Cause: every prop had one fixed spot in the upper frame plus bobbing motions. Backgrounds now declare a `ground` line and standing props a `base`; the stage places them on the ground and keeps them still. 85 scenes were affected. The check now fails on standing props in sky/space/cloud/sea scenes; 6 scenes and 7 Brainy spots were fixed. Verified by measuring standing props during playback (no vertical movement) and screenshots.

## 2026-11-14 (films: rain and sun-goes, T-109)
- Two more ElevenLabs podcasts (English) became films: `rain` (8 questions, 79 scenes) and `sun-goes` (7 questions, 84 scenes). Added 5 backgrounds, 23 props and two card icons. `sky-blue` retitled «Why the sky is blue?»; its source file was renamed to match.
- `make_film.py` now takes caption times from word timestamps: segment times were ~1.2 s early on Rain. Checks: 244 unit tests, full e2e 224/224, first-question play-through for both new films in Chromium and WebKit.

## 2026-11-14 (interactive films, T-107)
- The task targeted a nonexistent vanilla prototype (`assets/film.js`, `tools/*.py`), so it was adapted to the monorepo (D-29, [films.md](../dev/films.md)): `core/film.ts` checks, `packages/films` art/stage, `/video/[id]` film player, `/lab/film`, `make_film.py` (local faster-whisper via uv, ffmpeg decode), `pnpm check:films`.
- First film `sky-blue` came from the ElevenLabs mp3, which turned out to be **English**. Captions were proofread; 8 question pauses were placed from `silencedetect` silences; 83 scenes. Checks: 208 unit tests, full e2e 224/224.

## 2026-11-14 (bridge and Picture Puzzle)
- Completed T-19/T-29/T-85 and light T-89/T-90: ported GSP bridge/Phaser/puzzle, four-placement adapter, manifest-backed DB/runtime metadata, build/asset validation and conformance. D-28 records the protocol and minimal game columns.
- Check, 159 unit tests and asset audit pass. Full e2e initially passed 209/216; after fixes, all 44 affected reruns pass. Reviewed WebKit phone/iPad puzzle and lab screenshots. Parent/Settings changes remain separately owned; Tangram Tales and deployment were not attempted.

## 2026-11-14 (Settings, paired devices and onboarding)
- Completed T-103: parent Settings, scrypt PIN changes, eleven timezones (NY default), revocable device sessions and one-time pairing; adult gate, stage celebrations/feed, task dates and empty states. D-27 records timezone/pairing persistence.
- Polished quiz-first onboarding with progress/reactions, a gentle story, hold/reduced-motion reveal and optional referral entry; preserved `quizStart` and added only signup timezone.
- Check, 159 workspace unit tests and 28 final-build Settings/onboarding/calendar browser checks passed; full browser run passed 215/216; fixed the remaining lab readiness race and all 8 lab reruns passed. WebKit screenshots reviewed. Game implementation remains in separate commit `286021c`. Next: English locale/Tangram Tales after the games handoff, fresh demo recordings and physical iPad rehearsal; no deployment.

## 2026-11-14 (daily and weekly resets)
- T-103 calendar slice: one daily bonus per child across devices, local-midnight task/streak rollover, Monday goal-progress reset and read-only parent history; transactional lazy persistence (D-26), no cron or schema change.
- Added boundary, concurrency, stale-action, retry and cross-device browser checks. Demo reset clears task history but preserves daily eligibility. Fixed an existing lab-test readiness race and updated report checks for a previously claimed bonus.
- Verified check, 107 unit tests, 29 report-tool tests and 176 e2e checks; WebKit phone/iPad screenshots reviewed. Next: Settings (child, PIN, timezone, devices), pairing and adult-task fallback; deployment deferred.

## 2026-11-14 (task cancellation and badges)
- T-103 first slice: shared-state child/parent navigation counts and parent-only cancellation of assigned tasks. Core protects pending/completed tasks and preserves wallet, stats and weekly goal; counts sync by polling and parent badges hide while locked.
- Verified `pnpm check`, 99 unit tests and 172 e2e checks across Chromium/WebKit phone and landscape iPad; reviewed WebKit screenshots. T-103 remains open for daily/weekly resets, daily bonus, Settings, pairing and adult-task fallback.

## 2026-11-14 (skills, onboarding)
- Analysed new inputs (ROUTES.md + brainy-mvp.zip, 30-game handoff); licences checked (all permissive). D-22 locale/age, D-23 per-game weights → skills → body, D-24 quiz-before-signup + own login, D-25 reduced ROUTES.md adoption. Condensed in product/routes-spec.md and external-games.md.
- Built T-100–T-102: weights/minAge, live skills, `/onboarding` + `/api/onboarding`, `/login` + `/api/auth/login`, «Вернуть ребёнку», «Требует внимания», event feed, mood decay.

## 2026-11-14 (presentation acceptance)
- T-70 acceptance evidence and T-71 reset-first two-device script; T-61 all-route own-origin audit. Added accessory, video resume, child-ranking and task goal/responsibility checks.
- Re-recorded MVP and learning from separate fresh DBs: 32 screenshots and four successful walkthroughs; frames reviewed. Interrupted captures were discarded.
- Landscape post-game columns and wider Gifts/Leisure grids; existing parent columns reviewed. Optional T-87 reward animation deferred.
- Verified check, 94 unit tests, 156 e2e plus 32 focused rechecks; Chromium/WebKit phone and landscape iPad screenshots reviewed. Next: physical iPad rehearsal, pitch and freeze; deployment stays last.

## 2026-11-14 (landscape)
- Manual-run error explained/fixed: Turborepo strict env mode stripped `DEMO_MODE` (and no `.env.local`) → API 404 → load error. Added `globalPassThroughEnv` and `pnpm demo`.
- T-98 iPad landscape layout (rail, dock column, two-column Brainy) + portrait rotate hint; iPad e2e/report viewport → 1180 × 820. T-60 manifest + generated icons + theme color.

## 2026-11-14 (all pages)
- D-21 seeded showcase + `/api/actions`, PIN barrier (`/api/parent`), `/api/demo-reset`. Built entry, Learn advice, Leisure, video player, Gifts, Brainy shop, parent Analytics/Tasks/Gifts & goal, SVG charts, ViewTransition route fades; T-94 fixed.
- Verified: check; 94 unit; 132 e2e (Chromium/WebKit, phone/iPad) incl. parent → child task sync. New `mvp` report (20 shots, 2 walkthroughs); `learning` re-recorded; `scaffold` report retired.
- Next: T-70/T-71 demo proof, T-60–T-62 PWA/allowlist, pitch, freeze, then T-14.

## 2026-11-14 (reports)
- Reviewed changes since T-30 (T-34/35/54/55/80/81, D-17–D-20) and mapped the MVP acceptance criteria to remaining tasks in todo.md.
- T-95: new `learning` report module (scenario + child-only game solvers). Re-recorded `learning` (27/27 checks per flow, 12 shots) and `scaffold` (19/19). Found T-94: the practice card can repeat the game just played.
- Verified `pnpm check` and `pnpm test:reports`. No app code changed.

## 2026-11-14 (saved child flow)
- T-55 child subset: cookie-authorized versioned state, TanStack Query polling, issued launches, confirmed rewards and stop. D-20 replaces the local preview; only pending finish envelopes use tab storage.
- Verified: check/build; 86 unit tests; 112 e2e in Chromium/WebKit phone/iPad, including independent-device polling, lost-response reload/replay, newer balances, blocked storage and failed refresh. Six demo-off requests return 404 without opening a DB; WebKit screenshots reviewed. Normal pointer flows pass again (T-93); original cause unconfirmed.
- Final follow-up: launch-time expiry offers an explicit reload; the expanded expiry check passed in all four browser configurations after that change.
- Next: T-40 PIN barrier, T-41 minimal parent view and remaining T-55 parent polling, then T-70/T-71 connected proof. Broad tasks stay open; no deployment changes.

## 2026-11-14 (saved sessions)
- T-50/T-51 demo subset + T-52 cookie access; T-54 issued games and atomic saved results, T-81 session validation/replay/rollback tests. D-18 contract; D-19 native driver patch and deferred optional indexes (T-92).
- Verified: check/build; 82 unit tests; 40 Chromium UI/API + 8 WebKit API/browser-fetch tests; demo-off 404/no-DB smoke. Full WebKit UI is blocked by an independently reproduced native coordinate failure (T-93); Learn screenshot reviewed.
- Next: T-55 state polling and UI integration, then T-40/T-41 parent proof. Broad entity/scenario/PIN/task work stays open; no deployment changes.

## 2026-11-14 (learning loop)
- T-80 defines the connected demo slice; T-35 implements the per-tab post-game loop, Brainy/wallet updates, stop and one-time third-game break bonus (D-17). No DB writes yet.
- T-34 adds Continue the pattern (2 × 4 seeded rounds), shared shape kit and localized host text; T-24/T-25 add tested gain-policy and recommendation functions without inventing calibration/age norms.
- Verified: check clean; 70 unit tests; 64 e2e (Chromium + WebKit, phone + iPad); WebKit screenshots reviewed. Next: the T-50/T-51 demo data subset, then trusted finishes and parent polling.

## 2026-11-14 (shell)
- Single `master` branch (local + GitHub); personal notes → gitignored `.local/`.
- T-20 Brainy renderer + `/lab/brainy`, T-27 accessory rules, T-30 child shell (tab bar, dock, Brainy tab, fullscreen game). D-16 game scaling + T-89 – T-91.
- Verified: check clean; 51 unit, 44 e2e (Chromium + WebKit, phone + iPad); screenshots reviewed.

## 2026-11-14 (game contract)
- T-28: core types + seeded RNG; games kit, lazy registry, `GameHost` + error boundary; `pnpm check:games` in `pnpm check`.
- T-33 Odd one out (seeded), T-16 `/lab` (event stream, prod 404 unless `BRAINEE_LAB=1`), T-21 – T-23 core economy/stage/mood rules.
- Verified: check clean; 39 unit tests; 28 e2e in Chromium + WebKit (phone + iPad); lab gating; WebKit screenshot.

## 2026-11-14 (review)
- Reviewed T-12/T-88/T-13: no code fixes needed. Checks pass (lint, types, 18 DB, 29 report, 20 e2e in Chromium + WebKit; `db:reset` on a fresh file).
- Deployment moved to the final step: T-14 = Vercel Hobby + Turso free via Drizzle; live sync = polling (D-15, T-55); removed Railway/SSE notes; iPad testing over LAN before deploying (T-62, T-84).

## 2026-11-14 (13)
- Completed T-13: empty renderer/game packages, shared Vitest config, and SQLite/libSQL + Drizzle with a minimal family/child/wallet seed and local management commands.
- Verified 18 path/persistence tests, lint/type checks, production build and repeated real `db:reset`; checked additive seed, FK/integer constraints and rollback. No UI changes.
- Updated commands, setup and handoff. Next: T-28 contract before T-16 `/lab`; full schema/scenarios remain T-50/T-51.

## 2026-11-14 (12)
- Completed T-88 / D-14: analyzed and ported game-store-planning's local browser/video/Markdown reporting pipeline, with pinned workspace Playwright, Russian phone/iPad captures and linked artifacts.
- Generated `docs/reports/scaffold.md`: two MP4 walkthroughs (19 checks each), six screenshots and JSON timelines; documented commands, source links and local adaptations in the report guide.
- Verified production build, `pnpm check`, 29 tooling tests and 20 Chromium/WebKit checks; inspected captures and MP4 metadata. Next: T-13, then extend reports with implemented flows.

## 2026-11-14 (11)
- Completed T-12 per D-13: Base UI/shadcn shared components, local Onest/Unbounded WOFF2, Motion/Lucide setup, motion tokens and route-owned chrome.
- Verified build and 20 Chromium/WebKit checks at phone/iPad widths, including fonts, keyboard links and reduced motion; inspected screenshots. Confirmed shadcn resolves shared package paths.
- Recorded workflow preferences (now in `.local/`). Next: T-13 package tests, SQLite and `db:reset`.

## 2026-11-14 (10)
- Reviewed the T-10/T-11 scaffold: sound (exact versions, release-age guard, Biome, Tailwind 4 token mapping, same-origin + overflow + dark checks in Chromium/WebKit phone/iPad).
- Decided the app-like UI: shadcn on Base UI (incl. swipeable Drawer) + CSS → `<ViewTransition>` → Motion (D-13); new `docs/dev/ui.md`; the research section moved out of agent-tooling.md. T-12/T-30 expanded; polish T-86 → T-87 (the ID had been removed earlier).

## 2026-11-14 (9)
- Researched animation/loading/icon options for T-12 and added optional polish T-86. Verified installed Next.js/React support native ViewTransition without a flag against bundled and current official docs.
- Recorded recommendations in agent-tooling.md; no animation dependencies or runtime code changed.

## 2026-11-14 (8)
- Completed T-11: Next.js app with nested route groups, Russian starter pages/404 and runnable dev/build/start scripts; started T-12's shared prototype tokens.
- Verified production build and 16 Playwright smoke tests (Chromium + WebKit, phone + iPad widths), including same-origin requests, navigation and light/dark tokens. Updated setup and handoff.

## 2026-11-14 (7)
- Completed T-10: pnpm workspace + lockfile, Turborepo, shared TypeScript/Biome/Tailwind config, and an empty JIT `@brainee/core` package.
- Updated setup, Commands and progress (T-15); preserved the D-12 game plan. Verified dependency installation and `pnpm check`; T-11 is next.

## 2026-11-14 (6)
- Analyzed `../game-store-planning`: a tested any-engine bridge, engine kits, build pipeline and WebKit e2e already exist. Decided to port them instead of our drafted protocol (D-12).
- Removed from the plan: the `apps/game-lab` app (→ `/lab`), the `git` import source + `adapter.js`, the generated registry, the subdomain task T-86. Updated T-16, T-19, T-29, T-85.

## 2026-11-14 (5)
- Games now support any engine: React runtime + embedded runtime (same-origin iframe + `game-bridge` postMessage SDK); sources workspace / export / git with pinned SHA and `adapter.js` (D-11, T-19, T-29, T-85, T-86).

## 2026-11-14 (4)
- Compared game packaging (folders vs. per-game packages vs. iframes); chose self-contained folders + lazy registry, with promotion and iframe-adapter triggers (D-10, T-28, T-85).

## 2026-11-14 (3)
- Reviewed the product, planned stack and roadmap; identified follow-ups for demo scope, data integrity, security, scoring and device validation (T-80 – T-84).

## 2026-11-14 (2)
- Switched to local-first: SQLite/libSQL + Drizzle, `public/media`, single Railway container, demo session (D-05 – D-07).
- Added the game contract, `apps/game-lab` and `pnpm gen:game` → `docs/dev/games.md` (D-08); new tasks T-16 – T-18 and T-28.
- Reviewed agent skills and MCP servers → `docs/dev/agent-tooling.md` (D-09).

## 2026-11-14
- Analyzed the PRD (24 pp) and HTML prototype (T-01). No code exists yet.
- Picked the stack: pnpm + Turborepo, Next.js, Drizzle + Postgres, Better Auth, SSE (T-02, D-01 – D-04).
- Created the docs: README (summary + links), AGENTS.md (canonical) with CLAUDE.md and GEMINI.md importing it, `docs/product` (condensed PRD), `docs/dev`, `docs/progress`, and the prototype line map (T-03 – T-05).
