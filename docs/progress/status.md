# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P1 Scaffold (in progress)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress | T-10 – T-19 |
| P2 | Core logic + Brainy + game contract | ⬜ todo | T-20 – T-29 |
| P3 | Child flow | ⬜ todo | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | ⬜ todo | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch | ⬜ todo | T-70 – T-74 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
The Next.js app scaffold is ready (T-11). Next: finish `packages/ui` and self-hosted fonts (T-12), following [architecture.md](../dev/architecture.md).

## Handoff
- **Last session:** completed T-11: Next.js 16.4.6 + React 19.3.1, nested child/parent/auth layouts, starter `/learn`, `/analytics`, `/login`, root redirect and Russian 404. Added the Tailwind PostCSS integration and prototype tokens in `packages/ui`; fonts/components remain T-12. Production build and all 16 Playwright checks pass in Chromium + WebKit at phone/iPad widths; inspected WebKit screenshots. In-app browser unavailable; used the Playwright suite for rendering checks.
- **Next:** finish T-12 → finish T-13 (the `core` source stub exists; `brainy`, `games`, `db`, Vitest and SQLite do not). Then implement `/lab` and port the game pipeline as planned. Parent auth/barrier is still pending T-40/T-52; keep family data/actions out of the placeholder until then.
- **Blockers / open questions:** none blocking the scaffold. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
- **Not committed:** this session's app, UI tokens, dependency/script changes and documentation. No commit or push was requested.
