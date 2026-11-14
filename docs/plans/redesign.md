# Plan: lavender redesign and parent funnel

What to build, in order. **The visual source of truth is [product/design.md](../product/design.md)**: the Claude Design lavender system and the Brain component (D-36). The parent funnel comes from the [funnel analysis](../product/funnel.md). Decisions D-34 (English-only new work), D-35 (funnel at `/start`) and D-36 (design system, Brain mapping, kid-safe states, game palette) are in [decisions.md](../dev/decisions.md). Tasks are T-130–T-142 in [todo.md](../progress/todo.md). GitHub: issue #3 (redesign), #5 (PR #1 films first), #4 (games, separate).

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

### T-131 · Lavender tokens, fonts and icons (fast re-skin)

Remap the **existing token names** in `packages/ui/src/tokens.css` / `styles.css` so every current Tailwind class re-skins at once:

| Token | New value |
|---|---|
| `--bg` | `#F2F1FA` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#ECEAF6` |
| `--ink` | `#1C1B33` |
| `--muted` | `#5F6180` |
| `--line` | `#E6E4F2` |
| `--mint` (progress/positive) | `#5A3FE0` |
| `--sky` (gain/info) | `#2847C7` |
| `--coral` (loss/warning) | `#9A3B12` |
| `--sun` | `#FFAE1A` |
| `--orange` | `#F0A27E` |
| `--color-primary` | violet `#5A3FE0` (was ink) |
| `--color-ring` | `#8C76FF` |
| `--r` | 20 |

- **New tokens:** `--violet-wash #ECE8FF`, `--gain-wash #E3E9FF`, `--loss-wash #FDE6D8`, `--pink #FF9EC2`, `--night #2E2B55`, and radius tokens 12 / 16 / 28.
- **Washes:** use the explicit wash tokens instead of `/15` opacity where it matters (chips, notices).
- **Fonts:**
  - vendor Manrope woff2 (OFL) as `--font-b`;
  - `font-heading` → Manrope 800 with −0.02em;
  - add a `font-display` (Unbounded) utility for numbers, scores and badge marks only.
- **Icons:** Lucide at stroke 2 everywhere; custom only for Brainy, ★, ☀ and the flame.
- **Dark set:** derive it from the same names; light is the reference.
- **Motion:** add the design's press, enter, glow, bubble, pop and shake classes to `packages/ui/src/motion.css`, all off under reduced motion.
- Update [dev/ui.md](../dev/ui.md) (D-13 → D-36).

### T-132 · Brainy = the design's Brain component (primary)

Port `docs/ideas/claude-design/Brain.dc.html` into `packages/brainy`, following [design.md § The Brain component](../product/design.md#the-brain-component-braindchtml).
- **Model:** pure geometry, palette mixing, posture and effect amounts in `model.ts`, unit-tested. The SVG lives in `Brainy.tsx`.
- **Animation:** a small rAF hook at about 30 fps. It's off under reduced motion, pauses when `document.hidden` or off-screen, and only hero instances animate (`animate` prop).
- **Inputs:** follow the mapping table there:
  - energy = `mood` → palette, posture, run, blink;
  - stage → size, with lightning only at the top stage;
  - `brain` / `eyes` / `mouth` / `arms` / `legs` stats → lobes, eyes, smile, limbs, stride;
  - earned rewards and `resp` → backpack, cape and the rest.
- **Accessories:** re-anchor all six to the new head, face and neck coordinates. Keep the shop previews correct.
- **Kid-safe by default** (`effects="kid"`): no stink, haze, flies or rot. Low energy is sleepy, droopy, sweaty and peach.
- **API:** keep `stats`, `equipped`, `label`, `className`, `data-brainy`; add optional `mood`, `animate`, `effects` and `talk` (PR #1).
- **Checks:** `/lab/brainy` gets sliders for mood/energy and stage plus the four reference states (92 / 62 / 38 / 10 → shown kid-safe). Update the tests and screenshots.

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

### T-138 · Restyle product pages from the design

The designs now exist ([design.md § Screen patterns](../product/design.md#screen-patterns-to-adopt)). Restyle:
- entry, game player chrome, post-game (+N bubble, gain pop);
- the break/stopping point ("That's all for today" card);
- Leisure/films, Gifts, Brainy shop;
- parent Analytics (Today brain card, needs attention with two actions, Week report "Went well / To work on", Feed with source), Tasks (quest rows), Rewards, Settings.

Keep the iPad landscape rail/dock layouts and all existing test IDs.

### T-140 · Child shell: hero card and live-brain tab bar

- **Dark hero brain card** on Learn and the Brainy tab: energy number, stage name, 10-segment progress to the next stage, chips for "+N★ today" and "N to <next stage>".
- **Tab bar:** Learn · Leisure · **[Brainy hub]** · Path · Gifts. The hub is 84 px with a progress ring and a badge. Active tabs get the violet dot. On iPad landscape the rail keeps the same items.
- **New Path tab:** weekly learning bars, the stage list with mini brains and "you are here", and earned rewards as a badge grid with progress. They move from the Brainy tab; the shop stays on Brainy.
- Update the e2e navigation specs (English names) and `child-shell` tests.

### T-141 · Game palette tokens

- Add the `--game-*` CSS variables and the `GAME_PALETTE` TypeScript export in `packages/ui` ([design.md § Game palette](../product/design.md#game-palette-fast-path-for-the-current-game-architecture)), plus a usage note in [dev/games.md](../dev/games.md).
- Restyle the host chrome (`GamePlayer`, `GameHost` frame, round progress, feedback toasts) with it.
- Applying the palette inside `packages/games/src/<id>` and to Phaser games is a change request for the games session (issue #4). Pinned artifacts keep their art.

### T-142 · Parent patterns

Restyle `AnalyticsScreen` as Today + Week sections using the design's parent cards:
- status scale, "needs attention" with actions, per-session list;
- weekly bars with "Went well / To work on".

Restyle `RewardsScreen` with the earned-breakdown card (★/☀ base + earned − spent). No PDF export.

### T-139 · Docs and recordings

- Update [ui.md](../dev/ui.md), [screens.md](../product/screens.md), [demo.md](../demo.md) and [pitch.md](../pitch.md).
- Re-record `pnpm report --video` for mvp + learning only after T-135–T-138.
- Run a full serial `pnpm e2e` before handing off.

## Order

T-130 → T-133 → T-131 → **T-132** → T-134 → T-140 → T-141 → T-135 → T-136 → T-137 → T-138 → T-142 → T-139.

## Open (owner)

- Dark mode: keep it or go light-only? The default is to keep a derived dark set.
- Billing provider and US prices: deferred (needs a decision entry).
- Should Explore previews remain in the redesigned child UI? (issue #4)
