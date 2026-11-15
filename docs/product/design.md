# Visual reference: the Claude Design "Lavender" system

**Source of truth for the redesign** (D-36). It extends the [funnel analysis](funnel.md), which shares the same tokens. The plan is [plans/redesign.md](../plans/redesign.md).

- **Origin:** Claude Design artifact `KJGLCmeh3ZVPLGeiJfzHey` (page `dcb81aee8d83`). It is a sister concept ("Izvilina", a school brain tracker) with the same mascot and lavender system.
- **Frozen copies** of the files we use are in [ideas/claude-design/](../ideas/claude-design/). They are `.dc.html` design-canvas files: static markup with `{{bindings}}` plus a `DCLogic` class. They need the canvas runtime (not included), so read them as source; they don't run in a browser.
  - Their Google Fonts `<link>` is reference only. We vendor fonts (hard rule).
  - **Their visible text is Russian placeholder copy for a school product.** Write English copy for our product; don't translate it or copy it (D-34).

| File | What to take |
|---|---|
| `Brain.dc.html` | **The mascot component**: geometry, palette by health, run cycle, blink, sparkles, lightning, sweat (plus stink and flies, which we don't use) |
| `BrainStates.dc.html` | Four reference states: 92 genius, 62 in shape, 38 wilting, 10 rotting |
| `AppLavender.dc.html` | Child app: dark hero brain card, zone cards, quests, path (week bars + stage list), badges, **tab bar with a live brain hub in the center**, +N bubble and gain/loss motion |
| `AppLavenderParent.dc.html` | Parent app: Today (brain card, "needs attention" with actions, per-session list), Week report ("Went well / To work on"), Feed (events with source), Rules |
| `KidTimeUp.dc.html` | "That's all for today" stopping screen (when it opens again, what still works) |
| `KidEvening.dc.html` | "Evening earned" breakdown: base + earned − lost, with a savings jar |
| `KidLock.dc.html`, `WidgetsKid.dc.html` | Lock-screen and home-screen widget styling (later, not MVP) |

## Tokens

| Role | Value | Notes |
|---|---|---|
| canvas | `#F2F1FA` | page background |
| card / surface | `#FFFFFF` | cards use a `0 0 0 1px #E6E4F2` ring instead of a border |
| ink | `#1C1B33` | text, limbs, **dark hero cards** |
| ink-soft | `#5F6180` | secondary text |
| line / ring | `#E6E4F2`, track `#ECEAF6`, strong ring `#DAD6F0`, done ring `#CFC8F7` | |
| primary | `#5A3FE0`, light `#8C76FF`, ring-mid `#B9A8FF`, wash `#ECE8FF` | buttons, selection, active tab dot |
| highlight | pink `#FF9EC2`, soft `#FFF4F8` / `#FFE3EE`, deep `#FF6F9F` | top stage, "you are here", Brainy |
| **gain** | text `#2847C7` on `#E3E9FF` | rewards, correct, "+N" (blue, not green) |
| **loss / try again** | text `#9A3B12` on `#FDE6D8` | warnings, "−N", wrong (peach, not red) |
| neutral delta | `#5F6180` on `#F2F1FA` | |
| reward | amber `#FFAE1A` (stroke `#D9661A`) | ★, streak flame |
| night | tile `#2E2B55`, muted `#4A4570`, text `#CFCDE6`, dim `#A3A1C6` | on dark cards |
| radii | control 10–12, quest row 16, card 20–22, **hero/stage 28**, tab bar top 28, pill 999 | zone cards: one 22 px corner and three 8 px corners |
| shadow | hero `0 24px 40px -24px rgba(28,27,51,.55)`; tab bar `0 -10px 30px -14px rgba(28,27,51,.22)`; hub `0 16px 30px -12px rgba(90,63,224,.55)` | |
| type | **Manrope 500–800** for UI and **titles (800, −0.02em)**; **Unbounded 500/700 only for numbers**, scores, badge marks and the wordmark | titles 26–28, section 18/800, body 15, meta 12–13, tab label 11/800 |
| controls | primary 46 px (radius 14); quest rows ≥ 60 px; grade-like tiles 76 px; tab targets ≥ 54 px | child surfaces keep ≥ 56 px |
| icons | 24 px stroke icons, `stroke-width: 2`, round caps and joins | **Lucide at 2 px** matches; custom only for Brainy, ★, ☀, flame |

## Motion (all off under `prefers-reduced-motion`)

- **Press:** `scale(.95)` with `cubic-bezier(.34,1.56,.64,1)` over 0.2 s.
- **Screen enter:** fade plus 10 px rise, 0.34 s, `cubic-bezier(.2,.8,.2,1)`.
- **Hero ring glow:** 2.6 s loop on the stage colour.
- **Reward bubble:** "+N" pill rises and fades over 1.5 s.
- **Gain pop:** scale 1.15 → 0.96 → 1, 0.6 s. **Loss shake:** ±6 px with rotation, 0.55 s.
- **Meter segments and the hub ring:** animate `stroke-dashoffset` / colour over 0.4–0.6 s.

## The Brain component (`Brain.dc.html`)

**Geometry:**
- viewBox `-30 -40 280 268` (aspect 280 : 268).
- Ground shadow ellipse at `cx 110, cy 219`.
- **Body:** six circles (lobes) drawn twice: a shade layer offset +7 px, then the fill layer.
  - Top row: (70,78) r44, (110,58) r46, (150,78) r44.
  - Bottom row: (62,118) r38, (110,124) r44, (158,118) r38.
- **Seven fold strokes** (width 5, opacity 0.6).
- **Face:**
  - eyes at (92,104) and (128,104), r 7.5, with highlights r 2.4;
  - lids are body-coloured rects (blink every 3.4 s; sleepy when low);
  - mouth is a quadratic curve from a sad arc through a line to a smile;
  - cheeks `#FF6F9F` ellipses at (78,122) and (142,122).
- **Limbs:** ink strokes 6 px with round caps; shoulders at x 34 / 186, y ≈ 114; hips at x 92 / 128, y ≈ 158.
  - hands: white circles r 6.5 with a 3 px ink stroke;
  - shoes: violet `#5A3FE0` ellipses 11 × 6.5.

**Palette by health** (fill, shade, fold), mixed smoothly:
- ≥ 70: `#FF9EC2`, `#E9719F`, `#C24E7E`;
- around 40: `#F2B8A8`, `#D88E7C`, `#B06A5A`;
- 0: `#BDB97E`, `#8E8A52`, `#6B6838`.

**Animation:**
- runs on rAF at about 30 fps and stops under reduced motion;
- run amount `(h − 40) / 35`: step rate, bob, elbow bend and alternating knee lift;
- droop `(50 − h) / 50`: squash, lower arms, knees inward;
- **≥ 75:** violet sparkles and a soft yellow glow `#FFE066`; lightning bolts `#FFAE1A` / `#FFF6C8` flash around the head;
- 20–55: a sweat drop `#6FA8FF`;
- below 50: stink wisps, haze and puffs; below 45: flies; below 60: rot spots.

### How it maps onto Brainy (decided in D-36)

Keep the public API (`<Brainy stats equipped label className />`) so existing pages keep working. Add the optional `mood`, `animate` and `effects` props.

| Brain input | Brainy source |
|---|---|
| health (palette, posture, run, blink) | **energy = `mood`** (0–100; decays when idle, floor 30, `moodNow`) |
| sparkles + glow | energy ≥ 75 |
| lightning | **top stage only** ("Genius" in `STAGES`) and energy ≥ 75 |
| overall size | stage index (small → full) |
| lobe plumpness | `brain` stat (radius scale about 0.92–1.08) |
| eye size, sleepy lids | `eyes` stat (sleepy below 35) |
| smile width and curve | `mouth` stat |
| limb thickness, hand size | `arms` stat (stroke about 5–7.5) |
| leg length and stride | `legs` stat |
| backpack, cape, badge, garden | earned rewards / `resp ≥ 70` (existing flags) |
| hat, glasses, phones, bowtie, scarf | `equipped`, re-anchored to the new head (top ≈ y 12), eyes (y 104) and neck (≈ y 160) |

**Kid-safe effects (default `effects="kid"`):** no stink, haze, flies or rot spots for 4–10-year-olds ("Brainy never dies"). Low energy shows the sleepy, droopy, sweaty and peach-palette versions only. `effects="full"` (rot, stink, flies) is used **only in the parent funnel at `/start`** as a marketing device (D-40, [funnel.md](funnel.md#the-brain-meter-d-40)); no child or parent app surface uses it.

**Performance:** only hero instances animate (`animate`). Shop thumbnails, list rows and the tab hub render static or at a lower rate, and pause when hidden (`document.hidden`) or off-screen.

## Screen patterns to adopt

| Pattern | Use in Brainy |
|---|---|
| **Dark hero brain card** (`#1C1B33`, r28): brain in a 188 px lavender circle with a glow ring; big Unbounded number; stage name; **10-segment meter**; chips "+N today" / "N to next" | Learn top and Brainy tab: energy, stage, progress to next stage, stars today |
| **Tab bar with a live hub**: white, top radius 28; raised 84 px brain hub with a ring of progress and a score badge; active tab gets a violet 18 × 4 dot | Child tabs: **Learn · Leisure · [Brainy hub] · Path · Gifts** (Path = week + stages + earned rewards) |
| **Zone cards** (2 × 2, each with one rounded 22 px corner) | Six skills / body parts with a value, bar and "why" line |
| **Quest rows** (≥ 60 px, 26 px check box, reward pill) | Today's tasks (app ★ / real ☀) |
| **Path**: dark weekly bar card + stage list with a mini brain each and a "you are here" pill | Stage path (our 5 stages) + weekly learning minutes |
| **Badges grid** (3 columns, 48 px marks, locked at 50 % opacity) | Earned rewards with progress |
| **+N bubble + gain pop / loss shake** | Post-game ★, task approval, accessory purchase |
| **"That's all for today" card** (when it opens again, what still works) | Break / stopping point after 3 games, fun-time ended |
| **Earned breakdown** (base + earned − lost, savings) | Parent ★/☀ summary; Leisure time explanation |
| **Parent Today**: brain card with status scale, **"needs attention"** card with two actions, per-session list | Parent Analytics top (the existing "needs attention" block) |
| **Parent Week report**: bars + "Went well / To work on" | Parent weekly section (no PDF for now) |
| **Parent Feed** (events grouped by day, with source) | Existing event feed |

## Not for Brainy

- **School features:** grades, homework, the AI homework check, teacher and director screens, class league, TikTok blocking.
- **Kid rankings:** "League" is a ranking, and the product rule forbids kids seeing rankings.
- **Gross-out states:** rot, flies and stink in the child app (allowed only in the parent funnel, D-40).
- **Third-party resources:** Google Fonts links; we vendor everything.
- **Lock screen / widgets:** later.

## Game palette (fast path for the current game architecture)

The redesign defines `--game-*` CSS variables and a `GAME_PALETTE` TypeScript export in `packages/ui`. They share values with the tokens so they can't drift:
- **React games:** use the CSS variables.
- **Phaser / canvas games:** import the hex values.
- **Pinned path-C artifacts:** keep their own art (D-32); only the host chrome around them is restyled.

| Key | Value | Use |
|---|---|---|
| `surface` | `#F2F1FA` | game background |
| `tile` / `tileRing` | `#FFFFFF` / `#E6E4F2` | answer tiles and cards |
| `selected` / `selectedWash` | `#5A3FE0` / `#ECE8FF` | current selection |
| `correct` / `correctWash` | `#2847C7` / `#E3E9FF` | right answer (pair with a ✓ shape) |
| `retry` / `retryWash` | `#9A3B12` / `#FDE6D8` | wrong answer, gentle (pair with a hint) |
| `star` | `#FFAE1A` | ★ |
| `highlight` | `#FF9EC2` | celebration, Brainy |
| `shapes` | `#5A3FE0`, `#FF6F9F`, `#FFAE1A`, `#2847C7`, `#F0A27E`, `#1C1B33` | shape and category colours; always paired with distinct shapes for colour-blind safety |

The redesign only provides the palette; game folders are out of scope for it.

## Line map (frozen files)

| File | Lines | What |
|---|---|---|
| `Brain.dc.html` | 16–151 | SVG layers in paint order |
| | 154 | props: `health` 0–100, `size` 80–480, `animate` |
| | 161–190 | health clamp, run amount, rAF loop (~30 fps, reduced-motion guard) |
| | 192–211 | colour mix and palette stops |
| | 220–411 | per-frame values: bob, droop, arms, legs, mouth, blink, sweat, stink, haze, puffs, flies, lightning |
| `BrainStates.dc.html` | 15–45 | four reference cards (92 / 62 / 38 / 10) |
| `AppLavender.dc.html` | 15–33 | motion CSS (press, enter, spin, glow, bubble, gain/loss) |
| | 44–53 | greeting + streak chip |
| | 55–79 | dark hero brain card |
| | 81–99 | zone cards |
| | 101–118 | quest rows |
| | 208–243 | Path screen |
| | 245–261 | badges grid |
| | 265–305 | tab bar with live brain hub |
| | 345–350, 383–386, 404–425 | stage thresholds, gain/loss tones, segments and zone colour logic |
| `AppLavenderParent.dc.html` | 29–114 / 115–177 / 178–210 / 211–256 / 257–279 | Today / Week / Feed / Rules / tab bar |
| `KidTimeUp.dc.html` | 19–45 | stopping card |
| `KidEvening.dc.html` | 22–76 | earned breakdown + savings jar |
| `WidgetsKid.dc.html` | 26 / 91 / 157 | small / medium / large widgets (later) |

## Implementation notes

- **Porting `.dc.html`:**
  - `{{x}}` bindings become props or computed values;
  - `<sc-if>` / `<sc-for>` become JSX conditionals and maps;
  - inline styles become Tailwind classes on the T-131 tokens;
  - `dc-import name="Brain"` becomes `<Brainy>`;
  - `DCLogic.renderVals()` math moves into pure functions (Brainy model in `packages/brainy`, game and economy rules in `packages/core`).
- **SVG:** keep the 280 × 268 viewBox and the paint order. Render the six lobes twice (shade layer offset +7 px, then fill) and draw the folds on top.
- **Animation:** one shared rAF ticker for all animated Brainy instances (not one per instance). Throttle to ~30 fps, stop when `document.hidden`, when off-screen (IntersectionObserver) or under reduced motion. Static instances compute one frame with `t = 0`.
- **Colour roles:** primary actions violet; progress bars violet / `#8C76FF`; positive feedback blue on blue wash; negative feedback peach on peach wash; the top stage and Brainy highlights pink. Avoid green and red.
- **Typography:** Manrope 800 titles (26–28 px, −0.02em), 18/800 section headers with a muted count on the right, 15/700 row titles, 12–13/600 meta. Unbounded only for numbers (score, stars, badge marks).
- **Layout:** phone content padding 20 px; card gaps 8–16 px. Cards are white with a 1 px `#E6E4F2` ring (box-shadow), not borders. The dark hero card uses `#1C1B33` with `#CFCDE6` / `#A3A1C6` text. iPad landscape: hero card in the left column, lists on the right, with the rail replacing the bottom bar.
- **Accessibility:** tab bar buttons use `aria-current="page"`; the hub's `aria-label` describes Brainy's state; meters and rings are `aria-hidden` with the value given as text; touch targets are ≥ 56 px on child surfaces.
