# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 demo prep + redesign planning

## Phases

| # | Phase | Status | Tasks |
|---|---|---|---|
| P0 | Docs & planning | ✅ done | T-01 – T-05 |
| P1 | Scaffold monorepo + game pipeline | 🔄 in progress (T-17 – T-18 left) | T-10 – T-19 (no T-14) |
| P2 | Core logic + Brainy + game contract | ✅ done | T-20 – T-29 |
| P3 | Child flow | ✅ presentation scope done | T-30 – T-38 |
| P4 | Parent flow | ✅ presentation scope done | T-40 – T-46 |
| P5 | Data, auth, live sync | ✅ presentation scope done; broader data tasks remain | T-50 – T-55 |
| P6 | PWA + allowlist on a real device | 🔄 manifest and network audit done; real device next | T-60 – T-63 |
| P7 | Demo & pitch → **deploy last** | 🔄 acceptance walk and demo script done | T-70 – T-74, then T-14 |

Legend: ✅ done · 🔄 in progress · ⏳ next · ⬜ todo · ⛔ blocked

## Current focus
**Lavender redesign and parent funnel** per [plans/redesign.md](../plans/redesign.md) (T-131–T-142, D-35/D-36/D-37; visuals from [product/design.md](../product/design.md)), after the PR #1 films integration (issue #5). Games continue separately (issue #4). The jury-ready MVP stays working throughout: see [demo.md](../demo.md).

## Handoff
- Lavender redesign started on master. T-133 is complete: pure funnel routing, validation, v2/v3 migration, profiles/plans, quiz adapter and explicit-year age bands. Existing quizStart is unchanged; checkout remains disabled.
- Verification: pnpm check and pnpm test pass. Six new core tests cover all answer mappings, malformed state, deep links, migration, profiles and age ranges. No UI uses the new module yet, so no affected browser surface in this task.
- Next: T-131 tokens/fonts, then T-132 Brain component, following plans/redesign.md in order. Remaining redesign tasks and the final serial e2e/report recordings are pending.
- No push, deployment or production data access. Game internals and existing translations remain untouched.
