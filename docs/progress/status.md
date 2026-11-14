# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P7 Demo prep (all pages built)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-29 left) | T-20 – T-29 |
| P3 | Child flow | ✅ presentation scope done | T-30 – T-38 |
| P4 | Parent flow | ✅ presentation scope done | T-40 – T-46 |
| P5 | Data, auth, live sync | ✅ presentation scope done; broader data tasks remain | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | 🔄 manifest and network audit done; real device next | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | 🔄 acceptance walk and demo script done | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
**Presentation MVP: every page exists** (D-21). Child: entry, Learn with advice, two games and the post-game loop, Leisure, video quiz, Gifts, Brainy shop. Parent: PIN, Analytics (seeded), Tasks, Gifts & goal. Child ↔ parent sync works by polling. What's left before deployment: the [road map in todo.md](todo.md#road-to-mvp-acceptance-criteria--remaining-tasks).

## Handoff
- **Latest (skills, onboarding):** analysed the new `docs/ideas` inputs → D-22–D-25, condensed in [routes-spec.md](../product/routes-spec.md) and [external-games.md](../product/external-games.md). Built T-100 (per-game weights + live ability scores → body, minimum age 4–10 with locked cards), T-101 (`/onboarding` quiz before signup, own login `mama@example.com`/`demo1234`, 15-min PIN, «Вернуть ребёнку»), T-102 («Требует внимания», event feed, mood decay on read). New `onboarding.spec.ts`. Next: T-103 ROUTES.md follow-ups, then the device rehearsal below.
- **Previous (acceptance):** T-70 presentation acceptance walk and T-71 reset-first [two-device script](../demo.md). Expanded browser checks cover accessory buy/remove/wear on the dock and both post-game portraits, video pause/close/resume without early rewards, child routes without rankings, parent ranking initials, and confirmed task wallet/goal/responsibility changes. T-61 audits all page routes, both games, four videos, lab and PWA assets for foreign-origin requests.
- **Landscape:** post-game uses two columns at `lg`; Gifts uses two-column gift/task grids and Leisure uses three-column game/science grids. Parent Analytics, Tasks and Rewards already had `lg` columns; reviewed their existing layout. Phone layouts retain their vertical flow. Optional T-87 fly-to-wallet/counters remain deferred.
- **Verified:** `pnpm check` (one pre-existing non-null assertion warning in the core showcase test), 94 unit tests, all 156 e2e checks plus 32 focused checks after the final catalog/assertion changes. Chromium and WebKit, phone and landscape iPad; WebKit post-game screenshots reviewed.
- **Recordings:** regenerated [MVP](../reports/mvp.md) and [learning](../reports/learning.md) from separate fresh databases. All 32 screenshots and four phone/landscape-iPad walkthroughs passed (16 checks per MVP flow, 27 per learning flow); video frames reviewed. Interrupted captures were discarded and rerun.
- **Next (in order):** T-62/T-84 physical iPad LAN rehearsal using [demo.md](../demo.md), including Safari and Add to Home Screen → T-73 pitch deck → T-74 freeze/tag. T-87 is optional. T-14 deployment remains last; physical Screen Time allowlist validation follows it.
- **Notes:** `pnpm demo` gives a full reset and enabled demo server; PIN 1234. The HTTP `/api/demo-reset` restores showcase content only, preserving wallet, Brainy and game history. Analytics are labelled demo data; two playable learning games limit recommendations to two distinct games. Science is an animated placeholder (1 s = 1 min); fun games/cartoons demonstrate purchasing only. Stale route types: delete `apps/web/.next/dev`.
- **Rules to keep:** single `master`; local-first; no deployment before T-14; no new infrastructure. Rules remain in core and all resources stay on our origin.
- **Blockers / open questions:** physical device checks need an actual iPad. T-82 demo/production boundaries remain open (child snapshot carries parent demo data); product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
