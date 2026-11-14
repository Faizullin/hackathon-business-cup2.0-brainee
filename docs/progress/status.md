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
- **Last session:** researched page transitions, loaders, icons and UI style against the installed Next.js/React versions and current primary docs. Turned into the UI system [ui.md](../dev/ui.md) + D-13 (shadcn on Base UI, CSS → ViewTransition → Motion); polish is now T-87 (renamed from T-86 to avoid reusing a removed ID). No runtime changes. T-11 remains complete; its production build and 16 browser checks passed in the previous session.
- **Next:** finish T-12 (now includes the Base UI/shadcn setup, Motion, Lucide, moving visual chrome out of the root layout) → finish T-13 (the `core` source stub exists; `brainy`, `games`, `db`, Vitest and SQLite do not). Then implement `/lab` and port the game pipeline as planned. Parent auth/barrier is still pending T-40/T-52; keep family data/actions out of the placeholder until then.
- **Blockers / open questions:** none blocking the scaffold. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
- **Not committed:** this session's research/progress documentation. No commit or push was requested.
