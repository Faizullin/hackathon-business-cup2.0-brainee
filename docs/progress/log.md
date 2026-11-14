# Log

Append-only, **newest first**. One entry per session, 2–5 lines. Reference task IDs.

---

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
