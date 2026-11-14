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
Package tests and local SQLite tooling are ready (T-13). Next: the game contract (T-28), needed before the `/lab` host (T-16), following [architecture.md](../dev/architecture.md).

## Handoff
- **Last session:** completed T-13: empty `brainy`/`games` packages, shared Vitest setup for `core`/`brainy`/`games`/`db`, and a server-only libSQL/Drizzle package with Family/Child/Wallet, additive demo seed and push/reset/studio commands. Verified 18 DB tests, lint/type checks, production build, real default DB push/seed/repeated reset and gitignored data files. No UI changes; existing recordings remain applicable.
- **Next:** T-28 game types/contract and registry, then T-16 `/lab`; port the bridge/build pipeline under T-29/T-19. Deployment (T-14) remains a separate step. Full schema and scenario seeds remain T-50/T-51. Parent barrier/session remain T-40/T-52; motion effects remain T-87.
- **Blockers / open questions:** none blocking the scaffold. Product TBDs remain in [overview.md](../product/overview.md#open-questions-tbd).
- **Version control:** T-13 changes belong to one commit without co-author trailers; no push requested. Local database files stay ignored.
