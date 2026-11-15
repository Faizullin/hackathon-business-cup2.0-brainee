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
- **Phase B done:** `/start` in the `(funnel)` route group. UI in `apps/web/src/components/funnel/` (`Funnel.tsx` controller, `screens.tsx`, `BrainPanel.tsx`, `funnel.css`, `quiz-copy.ts`).
- **Phase C done:** `POST /api/onboarding/start` (`parseStartRequest` in core, `createFunnelFamily` in `packages/db/src/funnel-store.ts`, extends `signupFromQuiz` with `startMood` and `extras`). Family gets generated `family-<uuid>@brainee.example` credentials, PIN 1234, Brainy mood = funnel health (min 30), `showcase.startPlan` (plan, gift, minutes, earn, contactEmail), weekly goal = chosen gift, Starter Pack (+100 ★, cape owned and worn, `showcase.starterPack = "pending"`) only when `starterPack: true`. Funnel stores credentials in sessionStorage `brainee-family-login`; Settings shows a "Your login" card. Minutes per day and plan live in `showcase.startPlan` (no other place exists). "Notify me" on the age exit screen only stores the email in this browser (`brainy.notify-me`); nothing is sent.
- **Core cape pieces already in:** slot `back`, exclusive `cape` accessory (no price, `SHOP_ACCESSORIES`, `isExclusive`, buy refused with `exclusive`), `starter-seen` showcase action, `grantStarterPack`. Child wardrobe lists `SHOP_ACCESSORIES` only.
- **Phase D done:** cape drawn behind the body (`packages/brainy/src/Accessories.tsx`, `HeroCapeArt` export, replaces the old earned cape when worn), in `/lab/brainy` (Back slot), exclusive wardrobe row with the gold ribbon in `BrainyProfile`, unlock moment `components/child/StarterUnlock.tsx` shown on `/entry` while `showcase.starterPack === "pending"` and cleared by the `starter-seen` action.
- **Phase E to do:** rewrite old Playwright specs (onboarding, funnel-moments, jury, family-plan, own-origin) and add the new funnel spec; docs (`funnel.md`, `demo.md`, `routes-spec.md`, D-40/D-41 in `decisions.md`, `AGENTS.md`/`design.md` lines, `log.md`, `todo.md`); one `pnpm build` + `pnpm e2e`; PR.
- **Env notes:** Windows checkout has CRLF working files. Run `pnpm exec biome check --write <specific files>` only (never a directory: it rewrites line endings of untouched files). Install with `corepack pnpm install`. Nested `pnpm` calls need `pnpm` on PATH; for `db:reset` run `tsx --env-file-if-exists=../../apps/web/.env.local scripts/manage.ts reset` in `packages/db`. DB tests print EBUSY on temp-file cleanup on Windows (also the existing jury tests); the assertions pass. `next dev` writes `apps/web/AGENTS.md`: delete it, never commit it.
