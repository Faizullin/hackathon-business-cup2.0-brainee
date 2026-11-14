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
The shared UI foundation is ready (T-12). Next: package/Vitest setup and local SQLite reset (T-13), following [architecture.md](../dev/architecture.md).

## Handoff
- **Last session:** completed T-12 per D-13: `base-maia` shadcn setup targeting `packages/ui`, Button/Card/Skeleton, Lucide, vendored Cyrillic-capable fonts via `next/font/local`, motion tokens and strict async LazyMotion provider. Route layouts now own starter chrome through `AppFrame`; root has fonts/providers only. Build and all 20 Chromium/WebKit checks pass, including fonts, same-origin requests, keyboard links and reduced motion. Inspected phone/iPad screenshots; in-app browser remains unavailable.
- **Next:** T-13 in small steps: add empty `brainy`/`games`/`db` packages and Vitest; configure SQLite/Drizzle; implement and verify `db:reset`. Then `/lab` and game pipeline. Parent barrier/session remain T-40/T-52; do not put family data/actions in the placeholder. Game/reward transitions remain T-87.
- **Blockers / open questions:** none blocking the scaffold. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
- **Version control:** this session's changes belong to the T-12 commit, without co-author trailers; no push requested. Future completed work should follow that preference.
