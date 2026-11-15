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
**Branch `feature/brain-check-funnel` (T-149 to T-153, PR into master; spec: the task prompt; mockup: `docs/ideas/brain-check-funnel-mockup.html`).**
- **Phase A done:** core rules in `packages/core/src/funnel-quiz.ts` (screens, drains, `funnelHealth`, body stats, signals, old-plan adapter `toFamilyPlan`, display-only plans, honest-timer helpers, `parseStartRequest`) with tests; `/` is a server gate (`/entry` or `/start`); jury logic extracted to `lib/jury.ts`. Old route/profile/week code removed from `funnel.ts`; `/signup` reads the adapted draft.
- **Funnel UI is a stub** (`components/funnel/Funnel.tsx`) until Phase B.
- **Env note:** the Windows checkout has CRLF working files. Run `pnpm exec biome check --write <my files>` only; a repo-wide `pnpm check` reports CRLF noise on untouched files. Install with `corepack pnpm install`.
- **Next:** Phase B funnel UI (brain panel, 19 screens, jury header button, progress, `?reset=1`, existing-family card); C offer and `POST /api/onboarding/start`; D Hero Cape and unlock; E tests, docs, PR.
