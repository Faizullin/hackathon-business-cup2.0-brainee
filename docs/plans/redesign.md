# Plan: lavender redesign and parent funnel

What to build, in order. **The visual source of truth is [product/design.md](../product/design.md)**: the Claude Design lavender system and the Brain component (D-36). The parent funnel comes from the [funnel analysis](../product/funnel.md). Decisions D-37 (English-only copy, existing translations untouched), D-35 (funnel at `/start`) and D-36 (design system, Brain mapping, kid-safe states, game palette) are in [decisions.md](../dev/decisions.md). Tasks are T-131–T-142 in [todo.md](../progress/todo.md).

## Ground rules

- **Hard rules:** everything loads from our own domain; game and economy rules stay in `packages/core` (pure, tested); games never grant ★; no feeds, autoplay or kid rankings; Brainy never dies; no medical claims.
- **English only (D-37).** New UI text goes into feature-local English copy modules. **Never edit** `apps/web/src/i18n/en.ts`, `ru.ts`, `types.ts`, `context.tsx`, `content.ts` or existing strings; restyled pages keep their current `useI18n()` strings. No Russian in new code, docs, tests or seed data. The design files contain Russian placeholder copy: write English, don't translate.
- **Scope:** only this redesign. Don't touch unrelated games or game code: `games/**`, `packages/games/src/**`, `packages/game-catalog`, `packages/game-bridge`, `packages/engine-phaser`, `apps/web/public/games/**`, and the game specs. The host chrome around games is in scope (T-141).
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

### T-130 · Dropped (D-37)

No dictionary refactor. Follow the English-only rule above.

### T-131 · Lavender tokens, fonts and icons (fast re-skin)

**Design refs:** [design.md § Tokens](../product/design.md#tokens) and [§ Motion](../product/design.md#motion-all-off-under-prefers-reduced-motion); `AppLavender.dc.html` lines 15–33 (motion CSS), 36 (canvas, font), 56 (hero card colours and shadow), 89–95 (ring-instead-of-border cards, bar track `#ECEAF6`), 107–115 (quest rows, reward pills), 266 (tab bar shadow and radius).

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

**Design refs:** `Brain.dc.html` lines 16–151 (SVG layers in paint order: shadow, glow, haze, limbs, shoes, hands, body shade/fill, folds, rot spots, cheeks, eyes, lids, mouth, sparkles, bolts, sweat, wisps, puffs, flies), 161–168 (health clamp, run amount), 170–190 (rAF loop at ~30 fps with reduced-motion guard), 203–211 (palette stops), 220–411 (posture: bob, droop, arms, legs, mouth, blink, sweat, effects); `BrainStates.dc.html` (4 reference states and their captions); `AppLavender.dc.html` lines 57–58 (hero use, 188 px circle, size 200), 230–231 (78 px mini in lists), 284–285 (hub, 68 px circle on `#FFF4F8`). With `effects="kid"`, skip lines 22–29 (haze), 60–63 (rot spots) and 102–149 (stink wisps, puffs, flies); keep the sweat drop (line 100).

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
- **API:** keep `stats`, `equipped`, `label`, `className`, `data-brainy`; add optional `mood`, `animate` and `effects`.
- **Checks:** `/lab/brainy` gets sliders for mood/energy and stage plus the four reference states (92 / 62 / 38 / 10 → shown kid-safe). Update the tests and screenshots.

### T-133 · Funnel logic in core

Add `packages/core/src/funnel.ts`, pure and tested. Port it from `engine.mjs` (see [funnel.md](../product/funnel.md#logic-enginemjs)):
- `FUNNEL_QUESTIONS`, `isFunnelAnswers`;
- `reachable`, `entryFor`, `restoreFunnel` (v2/v3 → v4 migration);
- `profileFor`, `planFor`, `planText`, `weekFor`, `pauseFor`, `commercialPlans`;
- `funnelQuizAnswers()`, the [mapping table](../product/funnel.md#mapping-funnel-answers-onto-our-quiz-no-new-stats-model) onto the existing `QuizAnswers`, so `quizStart` is unchanged;
- age band → birth-year range.

### T-134 · Step page and answer rows

**Design refs:** funnel export `website/funnel.mjs` (`panel`, `strip`, `quizView`) and `funnel.css` (`.answer`, `.story-*`); [funnel.md § Elements to take](../product/funnel.md#elements-to-take) items 3–4; the press/enter motion from `AppLavender.dc.html` lines 15–19.

Two shared components, reusable in the funnel, onboarding, setup and settings:
- `StepPage`: Back, a progress bar, the chapter label, title/body/art and a pinned CTA. Focus moves to the `h1` on each step; reduced motion is respected.
- `AnswerRow` / `AnswerGroup`: a radio fieldset; the selected row gets the violet wash; Continue stays disabled until a choice is made.

Build them on Base UI/shadcn plus the existing Motion layer. iPad landscape uses two columns (art | content).

### T-135 · Parent funnel at `/start` (D-35)

**Design refs:** [funnel.md](../product/funnel.md) (screens, logic, mapping) with screenshots in `docs/product/funnel/`; replace the funnel's static mascot with the T-132 Brainy.

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

**Design refs:** funnel result screen ([phone](../product/funnel/phone-24-result.png), [iPad](../product/funnel/ipad-24-result.png)); `KidTimeUp.dc.html` (stopping card layout: title, reason, what opens when, what still works).

1. **Store the plan.** Save the funnel answers on signup as `showcase.familyPlan` (validated, JSON only; no schema change unless needed). Compute the plan in core at render time.
2. **Parent view.** A "Family plan" card on Analytics or Settings showing the phrase, 4 steps and "afterward, notice", with Edit (reuse the answer summary) and download/copy as text.
3. **Child view.** Show the agreed phrase on the post-game "real stopping point" and the break screen.
4. **Real-life task.** Offer the "back off-screen" step as a suggested real task template (☀). The parent still adds and approves it.

### T-137 · Demo moments

- **Funnel match demo:** build it in the funnel's own folder as a small React shape-match step with the game palette (T-141), like the export's `match` screen. Don't edit or import game internals; game code is out of scope. It creates no `game_sessions` row and no rewards.
- **Growth slider:** use the T-132 Brainy with stage presets from core.

### T-138 · Restyle product pages from the design

**Design refs:** `AppLavender.dc.html` lines 60–61 and 290–291 (+N bubble), 26–31 (gain pop, loss shake), 245–261 (badge grid); `KidTimeUp.dc.html` ("That's all for today" card for the break / fun-time end); `KidEvening.dc.html` lines 22–76 (earned-minutes breakdown → Leisure time explainer); [design.md § Screen patterns](../product/design.md#screen-patterns-to-adopt).

The designs now exist ([design.md § Screen patterns](../product/design.md#screen-patterns-to-adopt)). Restyle:
- entry, game player chrome, post-game (+N bubble, gain pop);
- the break/stopping point ("That's all for today" card);
- Leisure/films, Gifts, Brainy shop;
- parent Analytics (Today brain card, needs attention with two actions, Week report "Went well / To work on", Feed with source), Tasks (quest rows), Rewards, Settings.

Keep the iPad landscape rail/dock layouts and all existing test IDs.

### T-140 · Child shell: hero card and live-brain tab bar

**Design refs:** `AppLavender.dc.html` lines 44–53 (greeting + streak chip with flame icon), 55–79 (dark hero card: glow ring, Unbounded score, stage name, 10 segments, legend, chips), 81–99 (zone cards with one 22 px corner), 101–118 (quest rows), 208–243 (Path: dark weekly bars card, stage rows with mini brains and "you are here"), 245–261 (badges), 265–305 (tab bar with raised hub, progress ring `pathLength=100`, score badge, active dot), 345–350 and 404–408 (stage thresholds and segment fill logic).

- **Dark hero brain card** on Learn and the Brainy tab: energy number, stage name, 10-segment progress to the next stage, chips for "+N★ today" and "N to <next stage>".
- **Tab bar:** Learn · Leisure · **[Brainy hub]** · Path · Gifts. The hub is 84 px with a progress ring and a badge. Active tabs get the violet dot. On iPad landscape the rail keeps the same items.
- **New Path tab:** weekly learning bars, the stage list with mini brains and "you are here", and earned rewards as a badge grid with progress. They move from the Brainy tab; the shop stays on Brainy.
- Update the e2e navigation specs (English names) and `child-shell` tests.

### T-141 · Game palette tokens

**Design refs:** [design.md § Game palette](../product/design.md#game-palette-fast-path-for-the-current-game-architecture); gain/loss tones in `AppLavender.dc.html` lines 383–386 and 411–412.

- Add the `--game-*` CSS variables and the `GAME_PALETTE` TypeScript export in `packages/ui` ([design.md § Game palette](../product/design.md#game-palette-fast-path-for-the-current-game-architecture)), plus a usage note in [dev/games.md](../dev/games.md).
- Restyle the host chrome (`GamePlayer`, `GameHost` frame, round progress, feedback toasts) with it.
- Don't apply it inside game folders; game code is out of scope. Pinned artifacts keep their art.

### T-142 · Parent patterns

**Design refs:** `AppLavenderParent.dc.html` lines 29–114 (Today: brain card with status scale, needs-attention card with primary + later actions, per-session list, tasks summary), 115–177 (Week: report header, bars, day detail, stats, "Went well / To work on"), 178–210 (Feed: filters, events grouped by day with source), 211–256 (Rules → our Settings styling only), 257–279 (parent tab bar). Skip school content (lessons, grades, homework, TikTok, PDF).

Restyle `AnalyticsScreen` as Today + Week sections using the design's parent cards:
- status scale, "needs attention" with actions, per-session list;
- weekly bars with "Went well / To work on".

Restyle `RewardsScreen` with the earned-breakdown card (★/☀ base + earned − spent). No PDF export.

### T-139 · Docs and recordings

- Update [ui.md](../dev/ui.md), [screens.md](../product/screens.md), [demo.md](../demo.md) and [pitch.md](../pitch.md).
- Re-record `pnpm report --video` for mvp + learning only after T-135–T-138.
- Run a full serial `pnpm e2e` before handing off.

## Order

T-133 → T-131 → **T-132** → T-134 → T-140 → T-141 → T-135 → T-136 → T-137 → T-138 → T-142 → T-139.

## Open (owner)

- Dark mode: keep it or go light-only? The default is to keep a derived dark set.
- Billing provider and US prices: deferred (needs a decision entry).
- Should Explore previews remain in the redesigned child UI? Until decided, restyle the existing Explore tab without changing its behavior.
