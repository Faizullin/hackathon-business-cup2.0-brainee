# Brainee: every MVP page, child and parent

All MVP screens, recorded from a local production build with `DEMO_MODE=1` and
a freshly reset seeded database. Rewards, tasks, gifts and accessories are
saved through the demo API and sync between devices by polling. Activity analytics use saved sessions and actions; historical/character
radars and ranking remain labelled demo data. Demo parent PIN: `1234`.
[Run instructions](README.md#mvp-module).

## Recordings

Each walkthrough first answers the parent Brain Check funnel (`/start?tour=1`):
the brain meter drops with each habit answer, the result shows the child's Brainy
today, the plan builder picks minutes and a gift, and the run stops on the offer
(display-only prices, no payment) without creating a family. It then opens the
app on “What are we playing now?”, goes to Learn (games and free science films),
browses Leisure's games for stars (Snake and Explore games), marks a task done and exchanges ☀ → ★ in Gifts, buys an accessory on
the Brainy tab, and visits Path for weekly learning, stages and discoveries.
Then it enters parent mode with the PIN, scrolls Analytics, confirms the
child's task in Tasks and opens Gifts & goal.

### Phone · 390 × 844

{{flow:phone-mvp}}

### iPad viewport · 1180 × 820 landscape

{{flow:ipad-mvp}}

## Parent Brain Check funnel

The `?tour=1` review run lives in session storage and never touches saved answers;
it creates no family, game session or reward. One-tap start and the Starter Pack
moment are covered by `apps/web/e2e/brain-check.spec.ts`. Spec: [funnel.md](../product/funnel.md).

### First question · brain meter at 80 / 100

{{compare:iPad (1180 × 820 landscape)=start-quiz@ipad|Phone (390 × 844)=start-quiz@phone}}

### Result · the child's Brainy today

{{compare:iPad (1180 × 820 landscape)=start-reveal@ipad|Phone (390 × 844)=start-reveal@phone}}

## Child screens

### Entry “What are we playing now?”

{{compare:iPad (1180 × 820 landscape)=entry@ipad|Phone (390 × 844)=entry@phone}}

### Learn

{{compare:iPad (1180 × 820 landscape)=learn@ipad|Phone (390 × 844)=learn@phone}}

### Leisure

{{compare:iPad (1180 × 820 landscape)=leisure@ipad|Phone (390 × 844)=leisure@phone}}

### Gifts

{{compare:iPad (1180 × 820 landscape)=gifts@ipad|Phone (390 × 844)=gifts@phone}}

### Brainy

{{compare:iPad (1180 × 820 landscape)=brainy@ipad|Phone (390 × 844)=brainy@phone}}

### Path

{{compare:iPad (1180 × 820 landscape)=path@ipad|Phone (390 × 844)=path@phone}}

## Parent screens

### PIN barrier

{{compare:iPad (1180 × 820 landscape)=parent-pin@ipad|Phone (390 × 844)=parent-pin@phone}}

### Analytics

{{compare:iPad (1180 × 820 landscape)=analytics@ipad|Phone (390 × 844)=analytics@phone}}

### Tasks

{{compare:iPad (1180 × 820 landscape)=tasks@ipad|Phone (390 × 844)=tasks@phone}}

### Gifts & goal

{{compare:iPad (1180 × 820 landscape)=rewards@ipad|Phone (390 × 844)=rewards@phone}}

## Logs and capture checks

[Download the flow timelines (JSON)](logs/mvp.json).

{{verification}}

The editable [template](src/mvp.md), [scenario](../../scripts/reports/scenarios/mvp.json)
and [walkthrough actions](../../scripts/reports/scenarios/mvp.mjs) define what
this report captures. Recorded in WebKit with English UI and New York time; `pnpm e2e` covers Chromium and WebKit.
