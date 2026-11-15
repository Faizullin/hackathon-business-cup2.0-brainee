# UI and motion system

The goal is an app that **feels like a native mobile app**: a persistent tab bar, sheets you can swipe, smooth page transitions, and a living Brainy. It also has to stay calm, accessible and fast on an iPad. Visual identity follows [design.md](../product/design.md) (D-36), using the existing token names in `packages/ui`. Manrope 800 titles and UI use local fonts; Unbounded is reserved for numbers and marks. The platform is English only (D-34). Light is the reference, with a derived dark set.

## Stack: four layers, use the lightest one that works

| Layer | Use for | Tool |
|---|---|---|
| 1. Components | Dialog, **Drawer (bottom sheet, swipe, snap points)**, Tabs, Toast, Popover, Switch, Slider, NumberField, Progress/Meter, ToggleGroup, Select | **shadcn/ui on Base UI** (`@base-ui/react`, a `base-*` style), copied into `packages/ui` and restyled with our tokens |
| 2. CSS motion | press feedback, hover/active, sheet and dialog enter/exit, skeletons | Tailwind transitions + Base UI `data-starting-style` / `data-ending-style`; no JavaScript |
| 3. Page transitions | tab cross-fade, push/pop slide (Learn → game), shared elements (game card → game header, dock Brainy → Brainy tab) | React `<ViewTransition>` + `addTransitionType` (React 19.3; Next 16 guide in `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) |
| 4. Physics and gestures | ★ flying into the wallet, animated counters, drag, list reorder | **Motion** (`motion/react`) via `LazyMotion` + `m.*` to keep the bundle small; Brainy's SVG animation uses its own shared ticker |

Icons: Lucide at stroke 2 for system and child controls; custom SVGs only for Brainy, stars, suns and flame. Don't add Vaul, Framer-only page-transition libraries, Lottie or another icon set without a decision entry.

## App shell (route-group layouts own the chrome)

```
app/layout.tsx              # html/body, fonts, providers only (no visual chrome)
app/(child)/layout.tsx      # Learn / Leisure / Brainy hub / Path / Gifts; matching iPad rail
app/(child)/(docked)/      # compact dark Energy summary; Learn keeps an iPad two-column layout
app/(game)/game/[id]/       # fullscreen sibling group: no dock or tab bar
app/(parent)/layout.tsx     # Analytics / Tasks / Gifts & goal / Settings; bottom tabs on phone, top tabs on iPad
app/(auth)/layout.tsx       # auth shell; /start is the Brain Check funnel ((funnel) group)
```
- Shared navigation and the compact Energy summary live in layouts. The full dark hero belongs to the Brainy tab; Path owns the weekly bars, stage list and discoveries.
- A nested game layout cannot remove its parent layout's chrome; T-30 uses the sibling `(game)` group for fullscreen play.
- Tab switch → cross-fade (150–200 ms). Drill-in (card → game) → slide in and back. Typed with `addTransitionType('push' | 'pop' | 'tab')`.
- The entry screen is a full-screen choice with a dark Brainy card and recommendation speech card. Its explicit alternative opens Learn; it has no dismiss gesture.
- Bottom sheets (accessory preview, gift confirm, parent "new task") use Base UI Drawer with snap points.

## Responsive surface scale and game media

`packages/ui/src/tokens.css` owns the `--ui-*` surface scale. Opt in with `ui-surface` at child, parent, Entry and post-game shells; game boards keep their own typography. Phone body/title/section sizes are 15/26/18 px; at 768 px they become 17/32/22 px. Tablet metadata is 13 px and secondary text 15 px. `ui-stack`, `ui-grid` and `ui-panel` use shared page gaps (20 → 28 px), card gaps (12 → 20 px) and padding (16 → 24 px). Page padding is 20 → 28 px. Preserve the lavender radii: controls 12, media 16 → 18, cards 20, heroes 28 px.

`ui-control` uses 48 px parent targets and inherits 56 px on child surfaces. Shared button icons grow from 20 to 24 px. Landscape keeps the child rail and summary column; portrait keeps bottom navigation. The learning catalog uses two generous columns, with its last odd card centered. Recommendations use three columns on tablets; phone recommendations remain horizontal. Leisure uses two tablet columns so film titles and actions have room.

`GameCardMedia` in `packages/ui` is the shared 4:3 image frame. The app's `GameThumbnail` adds the skill badge; Learn, Recommendations, Entry and Explore all use it. It accepts root-relative SVG, WebP and PNG paths, including versioned `/g/<id>/<version>/thumbnail.webp` paths, with no catalog or host dependency. Explicit 400×300 image dimensions, an aspect-ratio frame, `object-cover`, lazy loading and async decoding reserve the geometry. Failed or non-local sources show a lavender Brainy fallback; lock and age overlays remain visible. Images are decorative because the surrounding card supplies the accessible game title. Keep descriptions and age text outside the image available to assistive technology.

The parent funnel consumes the same scale and stacks below 1001 px. It can grow vertically rather than clipping answers or offers to the viewport. Reduced-motion rules still apply.

## Saved learning state (T-55)

<a id="temporary-learning-preview-t-35"></a>

`LearningProvider` at the root shares TanStack Query state across child/game routes. Child screens wait for a cookie-authorized snapshot; failed initial reads show a retry screen. Background failures keep the last confirmed state and show a notice. Polling pauses outside child/game routes and when the page is hidden; return/focus/reconnect refetches. The read, mutation and recovery contract lives in [sessions.md](sessions.md#shared-state-and-client-recovery-t-55).

`GamePlayer` waits for a server-issued launch before mounting `GameHost`. The post-game screen shows the immutable before/after receipt and actual capped gains, while its balance comes from current shared state. It offers an available game for the weakest trained body part (`practiceGame`), plus the next level (or a new level-one run after the last level). This fallback needs no age norms. The separate entry algorithm is [T-25](../product/screens.md#entry).

The former T-35 local balance/stat preview is removed. Only unacknowledged results use per-tab storage; no local awards are migrated into the server. Stopping waits for the server before navigating and showing Brainy's thank-you. Parent and child surfaces use the same saved snapshot with independent access controls.

## Motion tokens (put in `packages/ui`)

| Token | Value | Used for |
|---|---|---|
| `--dur-press` | 200 ms | button scale 0.95 on `:active` |
| `--dur-nav` | 180 ms | tab cross-fade, small slides |
| `--dur-sheet` | 280 ms | drawer/dialog |
| `--dur-reward` | 400–600 ms | ★ fly, stat +N, stage-up |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | most UI |
| Spring (Motion) | `{ type: 'spring', stiffness: 400, damping: 30 }` | Brainy, counters, drag |

**Calm by design** (product rules): every reward animation runs once and ends. No looping attention-grabbers, no slot-machine effects, no confetti on every tap. A big celebration is reserved for stage-up and finishing the weekly goal.

T-12 provides these tokens, a shared spring, CSS reduced-motion overrides and a strict `LazyMotion` provider with `MotionConfig reducedMotion="user"`. Use `m.*` from `motion/react-m` inside this provider for Motion effects. Base UI Button styles provide 48px default and 56px child targets. Links share the styles while preserving anchor semantics.

## Patterns per screen
- **Brainy summaries:** one dark card language, compact and horizontal on Learn, Leisure, Gifts and Explore; full on Brainy with its training action. Display the saved mood value as **Energy**. Growth and distance to the next stage come from stats, not Energy.
- **Brainy motion:** the port in `packages/brainy` preserves the design SVG paint order and re-anchors all six accessories. Its pure model maps stats to lobes, eyes, smile, limbs and stride. Only the top stage can show lightning. `effects="kid"` is the default; low Energy looks sleepy, without rot, stink or flies. `effects="full"` is allowed only in `/start` (D-40). Slot `back` draws behind the body (the exclusive Hero Cape). Animated instances share one approximately 30 fps ticker, stopped for reduced motion, hidden pages and off-screen instances.
- **Post-game before → after:** saved portraits and gains, a finite pink reward bubble and next choices. The third-game stopping card is dark, with the family's agreed phrase when available. iPad uses two columns.
- **★ earned:** 3–5 star sprites fly from the game card to the wallet, then the wallet number ticks up. Stars are the custom SVG.
- **Wrong answer:** the card shakes (CSS keyframe, 300 ms). Correct after a mistake: the "+4" chip pops.
- **Parent dashboard:** restrained. Charts animate in once; Base UI Tabs, Drawers and Toasts; Lucide icons.

## Mobile app feel checklist
- [ ] PWA manifest `display: standalone`, `theme-color` matching the tokens (light and dark), apple-touch-icon, splash colors (T-60)
- [ ] `100dvh` layouts, safe-area padding (already in the scaffold), bottom bar above the home indicator
- [ ] `overscroll-behavior: none` on the shell (no pull-to-refresh or rubber-band on the app frame)
- [ ] `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `user-select: none` on controls and games
- [ ] Touch targets ≥ 48 px (child ≥ 56 px); an `:active` state on everything, since no state may rely on hover
- [ ] No haptics (iOS Safari has no Vibration API). Feedback is visual, plus optional short sounds from our domain
- [ ] Skeletons/`loading.tsx` with a Brainy loader; a game's loader waits for the bridge `ready`. No fake progress

## Accessibility and reduced motion
- `MotionConfig reducedMotion="user"` at the root.
- `@media (prefers-reduced-motion: reduce)` disables `::view-transition-*` animations and CSS keyframes. **React ViewTransition doesn't do this automatically.**
- Base UI provides focus management, ARIA and keyboard support. Keep visible focus rings (`--sky`).
- Text contrast checked in both themes; never rely on color alone (★/☀ always have an icon and a number).

## Performance budget (iPad)
- Animate only `transform` and `opacity`. No layout-thrashing properties, no `filter: blur` on large areas.
- Motion via `LazyMotion` (`domAnimation` features); load the heavier features only where drag is used.
- Child route JS ≤ ~150 KB gzip, excluding games. Check with `next build` output.

## Verify
Playwright (Chromium + WebKit, phone + iPad) for flows; the `uishot` skill or Playwright traces for visual states; reduced-motion emulation in one spec; a real iPad pass before the demo (T-84).

## Lavender primitives (T-131)

Cards use a one-pixel ring and 20 px corners; control, row and stage radii are 12, 16 and 28 px. Selection uses violet wash; gains use blue on gain wash; retries use peach on loss wash. The design motion classes are `lv-press`, `lv-in`, `lv-glow`, `lv-bub`, `gainA`/`gainB`, `lossA`/`lossB`, `lv-seg` and `lv-ring`. All turn off under reduced motion. Use the glow only for hero stages; reward bubbles/pop/shake are finite.

`--accent` is violet for links, selection and active controls. `--highlight` is pink (`#FF9EC2`) with `--highlight-wash` (`#FFF4F8`) for badges and emphasis. The legacy `coral` token now means loss/attention brown, never brand or purchase emphasis. Wordmarks use ink and the Brainy icon. Purchases use violet with the relevant currency icon. Zone cards have one 22 px corner and three 8 px corners; quest rows are at least 60 px with a 26 px status mark. Parent tabs are at least 44 px and use violet active states.

The host uses `--game-*` tokens and the matching `GAME_PALETTE` from `packages/ui`. It shows one round-progress indicator and centers the board on iPad. This palette and chrome do not change game rules or grant rewards.

## Parent funnel and family plan

The Brain Check funnel (`components/funnel`, [funnel.md](../product/funnel.md)) owns its own progress, Back and Continue. `AnswerGroup` provides single-choice controls. The 19-screen `/start` flow, age exit, resume, review mode (`?tour=1`) and one-tap start are documented in [funnel.md](../product/funnel.md). New text belongs in feature-local English copy modules. Existing `useI18n()` calls read the English dictionary; there are no locale controls, locale cookie or language fallback (D-34).

The funnel's shape match and five-stage growth slider are previews: they create no game session or reward. A completed, validated funnel is required for signup, which converts the age band to an allowed exact birth year and ends at `/onboarding/setup`. `/onboarding` redirects to `/start`. Pricing remains pending with no checkout.

Validated answers are saved as `showcase.familyPlan`; core derives the phrase, four steps and observation prompt. Analytics offers parent editing and plain-text copy/download. The same phrase appears at the child's stopping point. The related off-screen task suggestion only fills the parent task form; the parent still creates and confirms the task.

## Interactive films

Registered films use the lavender player chrome and `FilmView`: playback starts only after Play, questions pause playback, and completion leads to the existing final quiz. There is no seek control or next-film prompt. The narrator slot receives the child's Brainy and accessories. Its optional `talk` value opens the mouth while the design's body animation remains off when `animate` is false. `/lab/film` uses the same tokens and tests the replaceable narrator; see [films.md](films.md).
