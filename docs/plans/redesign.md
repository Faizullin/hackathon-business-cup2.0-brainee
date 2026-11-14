# Plan: lavender redesign and parent funnel

What to build from the [funnel analysis](../product/funnel.md), in order. The decisions are D-34 (English-only new work) and D-35 (funnel as the parent entry) in [decisions.md](../dev/decisions.md). Tasks are T-130–T-139 in [todo.md](../progress/todo.md). GitHub: issue #3 (redesign), #5 (PR #1 films first), #4 (games, separate).

## Ground rules

- **Hard rules:** everything loads from our own domain; game and economy rules stay in `packages/core` (pure, tested); games never grant ★; no feeds, autoplay or kid rankings; Brainy never dies; no medical claims.
- **English only for new work (D-34).** Add new strings to `apps/web/src/i18n/en.ts` only. Don't add Russian strings or `content.ts` pairs. Russian falls back to English where a key is missing (T-130).
- **Order:** PR #1 films are integrated first (issue #5) because they touch `VideoPlayer`, `LeisureScreen` and `Brainy.tsx`. Game work stays in its own branch (issue #4). Don't edit `games/**` or `packages/games/src/<id>/**`.
- **Keep the existing product loop working:**
  - quiz-first signup, then setup/pairing (D-24 / D-29);
  - the jury path stays one tap;
  - saved learning, tasks, rewards, polling and recovery;
  - parent PIN.
- **Verify every task:**
  - `pnpm check` and `pnpm test`;
  - the affected Playwright specs on Chromium + WebKit, phone 390×844 + iPad landscape 1180×820;
  - render the changed pages and review the screenshots.

  Never run two builds or e2e runs in one checkout at the same time (that produced server 500s); use `BRAINEE_NEXT_DIR` / `BRAINEE_E2E_PORT` for parallel runs. Never put a global `cookie` header in the Playwright config; it replaces the session cookie jar and causes 401s.

## Tasks

### T-130 · English as the source dictionary (D-34)

- `apps/web/src/i18n/types.ts`: derive `Dictionary` from `en` instead of `ru`.
- `ru` becomes a deep-partial override, deep-merged over `en` at runtime, so a missing Russian key shows English.
- `content.ts` pairs stay for existing seed strings; new seed strings need no pair.
- **Tests:** a unit test for the fallback; the existing Russian e2e still passes.

### T-131 · Lavender tokens and fonts

- Map the funnel tokens into `packages/ui/src/tokens.css`, keeping the current token names (`--bg`, `--surface`, `--ink`, `--muted`, `--line`, accents, `--r`) so components keep working:
  - violet primary, lavender canvas;
  - card radius 20, child stage 28;
  - the shadow.
- Vendor Manrope woff2 (OFL) next to Onest and switch the body font. Keep Unbounded (already woff2).
- Child touch targets stay ≥ 56 px; 46 px controls are for parent surfaces only.
- **Dark mode:** derive a simple lavender dark set from the same names. Light is the reference.
- Update [dev/ui.md](../dev/ui.md) (D-13 → D-35 tokens).

### T-132 · Brainy in the new look

- Restyle the parametric `@brainee/brainy`: pink brain (`#FF9EC2` / `#E9719F`), violet shoes (`#5A3FE0`), ink limbs.
- Keep:
  - stat-driven body parts and the 5 stages;
  - accessory slots and the `label` prop;
  - the optional `talk` mouth from PR #1.
- Check it in `/lab/brainy`, and update the snapshot/unit tests.

### T-133 · Funnel logic in core

Add `packages/core/src/funnel.ts`, pure and tested. Port it from `engine.mjs` (see [funnel.md](../product/funnel.md#logic-enginemjs)):
- `FUNNEL_QUESTIONS`, `isFunnelAnswers`;
- `reachable`, `entryFor`, `restoreFunnel` (v2/v3 → v4 migration);
- `profileFor`, `planFor`, `planText`, `weekFor`, `pauseFor`, `commercialPlans`;
- `funnelQuizAnswers()`, the [mapping table](../product/funnel.md#mapping-funnel-answers-onto-our-quiz-no-new-stats-model) onto the existing `QuizAnswers`, so `quizStart` is unchanged;
- age band → birth-year range.

### T-134 · Step page and answer rows

Two shared components, reusable in the funnel, onboarding, setup and settings:
- `StepPage`: Back, a progress bar, the chapter label, title/body/art and a pinned CTA. Focus moves to the `h1` on each step; reduced motion is respected.
- `AnswerRow` / `AnswerGroup`: a radio fieldset; the selected row gets the violet wash; Continue stays disabled until a choice is made.

Build them on Base UI/shadcn plus the existing Motion layer. iPad landscape uses two columns (art | content).

### T-135 · Parent funnel at `/start` (D-35)

1. **Screens.** Port the 25 screens to React under the `(auth)` group. Changes from the export:
   - ask age right after the goal;
   - turn "outside 4–10" into a friendly exit;
   - skip the dead-end gaps on phones.
2. **Navigation and saving:**
   - URL steps that work with browser Back;
   - `localStorage` resume using the same key, so answers given in the static export carry over;
   - `?tour=1` review mode;
   - `?angle=` covers.
3. **Signup.** The result leads to signup: `POST /api/onboarding` accepts `funnel` answers, validates them with `isFunnelAnswers` and converts them with `funnelQuizAnswers`. Then `/onboarding/setup` as today. `/onboarding` redirects to `/start`, and the old child quiz is retired.
4. **Copy.** Rewrite the privacy dialog once signup is connected.
5. **Events.** Drop the funnel events for now; no third-party analytics.
6. **Offer.** Keep the offer screen as "pricing pending". No checkout and no payment provider.
7. **Jury path.** It stays one tap and can skip the funnel.

### T-136 · Family plan in the product

1. **Store the plan.** Save the funnel answers on signup as `showcase.familyPlan` (validated, JSON only; no schema change unless needed). Compute the plan in core at render time.
2. **Parent view.** A "Family plan" card on Analytics or Settings showing the phrase, 4 steps and "afterward, notice", with Edit (reuse the answer summary) and download/copy as text.
3. **Child view.** Show the agreed phrase on the post-game "real stopping point" and the break screen.
4. **Real-life task.** Offer the "back off-screen" step as a suggested real task template (☀). The parent still adds and approves it.

### T-137 · Demo moments

- **Funnel match demo:** run the real Odd One Out round in a demo mode. It creates no `game_sessions` row and no rewards.
- **Growth slider:** use the real `@brainee/brainy` with stage presets from core.

### T-138 · Restyle product pages

Restyle entry, child tabs and dock, game player chrome, post-game, Leisure/films, Gifts, Brainy shop, and parent Analytics/Tasks/Rewards/Settings with the new tokens and patterns.
- **Blocked on the AppLavender child/parent designs** (not in the export). Until then, apply only tokens and components.
- Keep the iPad rail/dock layouts.

### T-139 · Docs and recordings

- Update [ui.md](../dev/ui.md), [screens.md](../product/screens.md), [demo.md](../demo.md) and [pitch.md](../pitch.md).
- Re-record `pnpm report --video` for mvp + learning only after T-135–T-138.
- Run a full serial `pnpm e2e` before handing off.

## Open (owner)

- AppLavender child/parent screens are needed for T-138.
- Dark mode: keep it or go light-only? The default is to keep a derived dark set.
- Billing provider and US prices: deferred (needs a decision entry).
- Should Explore previews remain in the redesigned child UI? (issue #4)
