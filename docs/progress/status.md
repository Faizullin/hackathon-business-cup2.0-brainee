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
- **Latest (T-103 calendar slice):** shared daily bonus across devices; core calendar rollover at local midnight and Monday; archived completed/expired tasks in a read-only parent history; a fresh daily task quota. Reads and actions persist resets transactionally and notify both devices through versioned polling. D-26 records persistence and the default timezone; see [calendar resets](../product/mechanics.md#calendar-resets).
- **Current baseline:** T-100–T-102 plus the first T-103 slice (badges and task cancellation) remain complete. Calendar metadata uses the existing showcase JSON; no schema migration or service was added. The game streak remains device-scoped; opening another device cannot reclaim today's bonus. Saved receipts remain replayable without new rewards.
- **Verification:** `pnpm check`, 107 unit tests, 29 report-tool tests and all 176 e2e checks pass (Chromium/WebKit, phone and landscape iPad). WebKit history/reset screenshots reviewed. The lab seed test now waits for the initial board before comparing it after restart.
- **Next (in order):** T-103 parent Settings (child details, PIN, timezone, devices) → pairing code → adult-task fallback. Then T-29/T-85 same-origin iframe bridge + GSP Picture Puzzle (cap counted rounds), T-104 locale support and T-105 Tangram Tales. Games report results; the server grants rewards.
- **Demo prep:** refresh [MVP](../reports/mvp.md) and [learning](../reports/learning.md) recordings before freezing; existing captures predate T-100–T-103. Learning report checks now allow a bonus already claimed by another recording/device. T-62/T-84 physical iPad rehearsal using [demo.md](../demo.md), T-73 pitch and T-74 freeze follow. T-87 motion is optional; T-14 deployment stays deferred.
- **Run:** `pnpm demo` resets the DB and enables demo mode; child `/entry`, parent PIN 1234, login `mama@example.com` / `demo1234`, new family `/onboarding`. HTTP `/api/demo-reset` restores showcase content and clears task history, preserving wallet, Brainy, game history and daily bonus eligibility. Use a full DB reset for a fresh bonus rehearsal. Stale route types: delete `apps/web/.next/dev`.
- **Limits:** timezone defaults to `Asia/Almaty` until Settings supports selection; history retains 100 tasks. Analytics are labelled demo data; two playable learning games limit recommendations. Science media is on hold; the video is an animated placeholder. Fun games/cartoons demonstrate purchases only. Physical checks need an iPad; T-82 demo/production boundaries remain open.
- **Rules / blockers:** single `master`; local-first; business rules in core; own-origin resources; Russian UI in `ru.ts`; no deployment. No implementation blockers.
