# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P5 Data (demo subset)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-19 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | 🔄 in progress (T-26, T-29 left) | T-20 – T-29 |
| P3 | Child flow | 🔄 in progress (two games + saved learning loop done) | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | 🔄 in progress (saved child flow + polling done; parent next) | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | ⬜ todo | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
**Presentation MVP: every page exists** (D-21). Child: entry, Learn with advice, two games and the post-game loop, Leisure, video quiz, Gifts, Brainy shop. Parent: PIN, Analytics (seeded), Tasks, Gifts & goal. Child ↔ parent sync works by polling. What's left before deployment: the [road map in todo.md](todo.md#road-to-mvp-acceptance-criteria--remaining-tasks).

## Handoff
- **Last session:** a seeded `showcases` JSON row per child (analytics, tasks, recommendations, gifts, requests, leisure, science, accessories) inside `/api/state`. `POST /api/actions` → pure `applyShowcaseAction` (core) → one transaction. PIN barrier via `POST/DELETE /api/parent` (`demo_sessions.parent_until`). `POST /api/demo-reset` for tests and presentations. Built all remaining pages, hand-rolled SVG charts and React `<ViewTransition>` route fades. T-94 fixed. Retired the `scaffold` report; new [mvp report](../reports/mvp.md) (20 shots, two walkthroughs) and re-recorded [learning](../reports/learning.md). Verified: `pnpm check`; 94 unit tests; 132 e2e (Chromium + WebKit, phone + iPad), including the two-device parent → child task sync.
- **Next (in order):** T-70 acceptance walkthrough (rules.md checklist, mostly covered by `mvp-pages.spec.ts`) → T-71 two-device demo script → T-60 PWA manifest/icons → T-61 network audit → T-62/T-84 iPad over LAN → T-87 polish (optional) → T-73 pitch → T-74 freeze → T-14 deploy.
- **Notes:** analytics are illustrative and labelled «Демо-данные». Fun games/cartoons can be bought but have no content. The video player is an animated placeholder (1 s = 1 min). Demo PIN 1234. Reset the demo before presenting: `POST /api/demo-reset` (or `pnpm db:reset`). Stale route types: delete `apps/web/.next/dev`.
- **Rules to keep:** single `master` branch; no deploy work before T-14; don't assume a long-running process or a writable disk; `getDatabaseConfig` stays `file:`-only until T-14.
- **Blockers / open questions:** none. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd); T-82 demo vs production boundaries (child snapshot carries parent demo data).
