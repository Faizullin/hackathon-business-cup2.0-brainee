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
- **Phase A done:** core rules in `packages/core/src/funnel-quiz.ts` with tests; `/` server gate; jury logic in `lib/jury.ts`.
- **Phase B done:** `/start` moved to the `(funnel)` route group (no AppFrame). UI in `apps/web/src/components/funnel/`: `Funnel.tsx` (controller: hash steps, localStorage resume, `?tour=1`, `?reset=1`, existing-family card, Jury entry header button), `screens.tsx` (all 19 screens + exit + honest Starter timer hook), `BrainPanel.tsx` (brain meter, `effects="full"` only here), `funnel.css` (mockup CSS nested under `.bc`), `quiz-copy.ts` (English copy). Checked by hand at 1280x650 and 390x844: no scroll on desktop, no horizontal overflow on phone.
- **Offer CTA already calls `POST /api/onboarding/start` (not built yet: Phase C).** It sends `{funnel, childName, email, plan, starterPack}` and stores returned `credentials` in sessionStorage `brainee-family-login`, then goes to `/entry`.
- **Old Playwright specs (onboarding, funnel-moments, jury, family-plan, own-origin) still target the old funnel; Phase E rewrites them.**
- **Env note:** Windows checkout has CRLF working files. Run `pnpm exec biome check --write <my files>` only. Install with `corepack pnpm install`; nested `pnpm` calls need a `pnpm` on PATH (`db:reset` fails otherwise; run `tsx scripts/manage.ts reset` in packages/db). `next dev` generates `apps/web/AGENTS.md`: delete it, never commit it.
- **Next:** C: `POST /api/onboarding/start` + `signupFromQuiz` `startMood`/gift/plan storage + Your login card; D: Hero Cape and unlock moment; E: tests, docs, PR.
