# Status

> A snapshot: **overwrite it, don't append.** History goes in [log.md](log.md); tasks go in [todo.md](todo.md).

**Updated:** 2026-11-15 · **Phase:** P7 demo prep + redesign implementation

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
The lavender redesign now includes published D-33 films, D-34 English-only platform behavior and input hardening from `origin/master`, integrated in `../brainee-merge-trial` on `merge/origin-master`. Ready for owner review with the verification limits below.

## Handoff
**Branch `feature/brain-check-funnel` (T-149 to T-153) is complete and opened as a PR into master; do not merge it from an agent session.**
- **What shipped:** Brain Check funnel at `/start` (19 screens, brain meter, D-40), offer with display-only prices and an honest Starter Pack timer (D-41), `/` gate, Jury entry in every header, `POST /api/onboarding/start` one-tap family, exclusive Hero Cape (slot `back`) and the one-time unlock moment. Spec: [funnel.md](../product/funnel.md).
- **Checked:** core, brainy and db assertions pass (db prints EBUSY temp-file cleanup noise on Windows, also on existing tests); files changed on the branch pass `biome check`; production build ok; fast `pnpm e2e`: 91 passed, failures only in tangram, lab seed replay and `/login` keyboard focus on webkit-ipad (game and focus checks this change does not touch; one login test timeout was a flake and passed on rerun). Every funnel screen fits without clipping at 1280x650, 1366x680, 1440x780, 1920x960 and 1180x820, and without sideways scroll at 390x844 and 360x740. Not run: `pnpm e2e:full`, report regeneration.
- **Known limits:** "Notify me" on the age-Other exit only stores the email in the browser. Plan, gift and minutes live in `showcase.startPlan`. `pnpm typecheck` fails in `@brainee/game-catalog` (node types) on this machine, also without this branch.
- **Env notes:** Windows CRLF working files: run `pnpm exec biome check --write <specific files>` only. Nested `pnpm` needs a `pnpm` on PATH. `next dev` writes `apps/web/AGENTS.md`: delete it.
- **Next:** owner review and merge; physical iPad check of the funnel and unlock moment; real billing needs its own decision entry.
