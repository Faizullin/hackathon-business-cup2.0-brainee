# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-14 · **Phase:** P1 Scaffold (next)

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | ⏳ next | T-10 – T-19 |
| P2 | Core logic + Brainy + game contract | ⬜ todo | T-20 – T-29 |
| P3 | Child flow | ⬜ todo | T-30 – T-38 |
| P4 | Parent flow | ⬜ todo | T-40 – T-46 |
| P5 | Data, auth, live sync | ⬜ todo | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | ⬜ todo | T-60 – T-63 |
| P7 | Demo & pitch | ⬜ todo | T-70 – T-74 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
Scaffold the local-first monorepo (SQLite, no external services) following [architecture.md](../dev/architecture.md) (T-10).

## Handoff
- **Last session:** reviewed product goals, planned stack and implementation risks; added follow-up tasks T-80 – T-84. No application code exists yet.
- **Next:** define a small end-to-end demo slice (T-80), then begin T-10 and validate the deployment and iPad constraints early (T-84).
- **Blockers / open questions:** demo scope, reward incentives, score validity, production security boundaries and licensed media need decisions; product TBDs are in [overview.md](../product/overview.md#open-questions-tbd).
- **Not committed:** `docs/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and the README change are still uncommitted.
