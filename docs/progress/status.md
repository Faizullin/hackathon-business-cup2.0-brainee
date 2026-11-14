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
- **Latest (T-103, first slice):** shared-state tab badges show the child's assigned real-life tasks and the parent's pending confirmations / undelivered gifts. Parent counts stay hidden while PIN-locked. Parents can cancel assigned tasks; core rejects cancellation of pending/completed tasks and preserves rewards, stats and the weekly goal. Cross-device polling updates both screens.
- **Current baseline:** T-100–T-102 are built: per-game skill weights and age gates; quiz-before-signup and own login; 15-minute PIN and «Вернуть ребёнку»; dashboard attention cards, capped feed and read-time mood decay. Product decisions D-22–D-25 remain binding; scope is condensed in [routes-spec.md](../product/routes-spec.md) and [external-games.md](../product/external-games.md).
- **Verified:** `pnpm check`, 99 unit tests and all 172 e2e checks pass (Chromium/WebKit, phone and landscape iPad). WebKit screenshots reviewed; the new cancellation spec also captures before/after states.
- **Next (in order):** finish T-103 in small slices: daily bonus and daily/weekly resets → parent Settings (child, PIN, devices), pairing and adult-task fallback. Then T-29/T-85 same-origin iframe bridge + GSP Picture Puzzle (cap counted rounds), followed by T-104 locale support and T-105 Tangram Tales. Keep external artifacts pinned with licenses/credits; games report results, the server grants rewards.
- **Demo prep after those changes:** refresh the [MVP](../reports/mvp.md) and [learning](../reports/learning.md) recordings; existing captures predate T-100–T-103. T-62/T-84 physical iPad rehearsal using [demo.md](../demo.md), T-73 pitch and T-74 freeze follow. T-87 motion is optional; T-14 deployment stays deferred.
- **Run:** `pnpm demo` resets the DB and enables demo mode; child starts at `/entry`, parent PIN 1234, demo login `mama@example.com` / `demo1234`, new family `/onboarding`. HTTP `/api/demo-reset` restores showcase content only, preserving wallet, Brainy and game history. Stale route types: delete `apps/web/.next/dev`.
- **Limits:** analytics are labelled demo data; two playable learning games limit recommendations to two distinct games. Science media is on hold; current video is an animated placeholder. Fun games/cartoons demonstrate purchasing only. Physical device checks need an actual iPad. T-82 demo/production boundaries remain open (child snapshot carries parent demo data).
- **Rules:** single `master`; local-first; business rules in core; own-origin resources only; Russian UI in `ru.ts`; no deployment work. No new blockers for the remaining implementation slices.
