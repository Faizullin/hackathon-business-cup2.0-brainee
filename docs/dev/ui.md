# UI and motion system

The goal is an app that **feels like a native mobile app**: a persistent tab bar, sheets you can swipe, smooth page transitions, and a living Brainy. It also has to stay calm, accessible and fast on an iPad. Visual identity comes from the prototype tokens in `packages/ui` (D-13).

## Stack: four layers, use the lightest one that works

| Layer | Use for | Tool |
|---|---|---|
| 1. Components | Dialog, **Drawer (bottom sheet, swipe, snap points)**, Tabs, Toast, Popover, Switch, Slider, NumberField, Progress/Meter, ToggleGroup, Select | **shadcn/ui on Base UI** (`@base-ui/react`, a `base-*` style), copied into `packages/ui` and restyled with our tokens |
| 2. CSS motion | press feedback, hover/active, sheet and dialog enter/exit, skeletons | Tailwind transitions + Base UI `data-starting-style` / `data-ending-style`; no JavaScript |
| 3. Page transitions | tab cross-fade, push/pop slide (Learn → game), shared elements (game card → game header, dock Brainy → Brainy tab) | React `<ViewTransition>` + `addTransitionType` (React 19.3; Next 16 guide in `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) |
| 4. Physics and gestures | Brainy idle/bounce/stage-up, ★ flying into the wallet, animated counters, drag in games, list reorder | **Motion** (`motion/react`) via `LazyMotion` + `m.*` to keep the bundle small; Motion Primitives copied per component when useful |

Icons: Lucide for parent and system controls; the prototype's custom SVGs for Brainy, ★, ☀ and child tabs. Don't add Vaul, Framer-only page-transition libraries, Lottie or another icon set without a decision entry.

## App shell (route-group layouts own the chrome)

```
app/layout.tsx              # html/body, fonts, providers only (no visual chrome)
app/(child)/layout.tsx      # 4-tab bottom bar; (child)/(docked)/layout.tsx adds the Brainy dock (not on the Brainy tab)
app/(game)/game/[id]/       # fullscreen sibling group: no dock or tab bar
app/(parent)/layout.tsx     # 3-tab bottom bar on phone, side rail on iPad landscape
app/(auth)/layout.tsx       # centered single column
```
- Persistent parts (tab bar, dock, wallet) live in layouts, so they never re-animate when you navigate. Only the page content transitions.
- A nested game layout cannot remove its parent layout's chrome; T-30 uses the sibling `(game)` group for fullscreen play.
- Tab switch → cross-fade (150–200 ms). Drill-in (card → game) → slide in and back. Typed with `addTransitionType('push' | 'pop' | 'tab')`.
- The entry screen («Во что играем сейчас?») is a full-screen sheet that can't be dismissed (product rule): Base UI Dialog, not a swipeable Drawer.
- Bottom sheets (accessory preview, gift confirm, parent "new task") use Base UI Drawer with snap points.

## Saved learning state (T-55)

<a id="temporary-learning-preview-t-35"></a>

`LearningProvider` at the root shares TanStack Query state across child/game routes. Child screens wait for a cookie-authorized snapshot; failed initial reads show a retry screen. Background failures keep the last confirmed state and show a notice. Polling pauses outside child/game routes and when the page is hidden; return/focus/reconnect refetches. The read, mutation and recovery contract lives in [sessions.md](sessions.md#shared-state-and-client-recovery-t-55).

`GamePlayer` waits for a server-issued launch before mounting `GameHost`. The post-game screen shows the immutable before/after receipt and actual capped gains, while its balance comes from current shared state. It offers an available game for the weakest trained body part (`practiceGame`), plus the next level (or a new level-one run after the last level). This fallback needs no age norms. The separate entry algorithm is [T-25](../product/screens.md#entry-screen-во-что-играем-сейчас).

The former T-35 local balance/stat preview is removed. Only unacknowledged results use per-tab storage; no local awards are migrated into the server. `demoChild` retains only accessory/weekly-goal presentation for T-38/T-46. Stopping waits for the server before navigating and showing Brainy's thank-you. Parent access/view wiring remains T-40/T-41; child-mode polling alone does not complete the [parent demo proof](../progress/todo.md#smallest-end-to-end-demo-slice-t-80).

## Motion tokens (put in `packages/ui`)

| Token | Value | Used for |
|---|---|---|
| `--dur-press` | 120 ms | button scale 0.96 on `:active` |
| `--dur-nav` | 180 ms | tab cross-fade, small slides |
| `--dur-sheet` | 280 ms | drawer/dialog |
| `--dur-reward` | 400–600 ms | ★ fly, stat +N, stage-up |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | most UI |
| Spring (Motion) | `{ type: 'spring', stiffness: 400, damping: 30 }` | Brainy, counters, drag |

**Calm by design** (product rules): every reward animation runs once and ends. No looping attention-grabbers, no slot-machine effects, no confetti on every tap. A big celebration is reserved for stage-up and finishing the weekly goal.

T-12 provides these tokens, a shared spring, CSS reduced-motion overrides and a strict `LazyMotion` provider with `MotionConfig reducedMotion="user"`. Page transitions and reward effects remain T-87; use `m.*` from `motion/react-m` inside this provider when adding them. Base UI Button styles provide 48px default and 56px child targets. Links share the styles while preserving anchor semantics.

## Patterns per screen
- **Dock Brainy:** subtle idle breathing (scale 1 → 1.02, 3 s). Reacts when stats change (bounce + color shift). Uses a shared `view-transition-name` with the Brainy tab.
- **Post-game "before → after":** two Brainys, a stat chip counting up (Motion animated number), then the two «Что дальше?» cards stagger in.
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
