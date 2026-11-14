# Brainee: every MVP page, child and parent

All MVP screens, recorded from a local production build with `DEMO_MODE=1` and
a freshly reset seeded database. Rewards, tasks, gifts and accessories are
saved through the demo API and sync between devices by polling. **Analytics
numbers are seeded demo data (D-21)**, not calculated. Demo parent PIN: `1234`.
[Run instructions](README.md#mvp-module).

## Recordings

Each walkthrough opens the app on «Во что играем сейчас?», goes to Learn,
browses Leisure, watches a science video to the end (1 s = 1 min) and answers
its quiz (a wrong answer fades, the right one pays +15 ★ once), marks a task
done and exchanges ☀ → ★ in Gifts, and buys an accessory on the Brainy tab.
Then it enters parent mode with the PIN, scrolls Analytics, confirms the
child's task in Tasks and opens Gifts & goal.

### Phone · 390 × 844

{{flow:phone-mvp}}

### iPad viewport · 1180 × 820 landscape

{{flow:ipad-mvp}}

## Child screens

### Entry «Во что играем сейчас?»

{{compare:iPad (1180 × 820 landscape)=entry@ipad|Phone (390 × 844)=entry@phone}}

### Learn

{{compare:iPad (1180 × 820 landscape)=learn@ipad|Phone (390 × 844)=learn@phone}}

### Leisure

{{compare:iPad (1180 × 820 landscape)=leisure@ipad|Phone (390 × 844)=leisure@phone}}

### Science video player

{{compare:iPad (1180 × 820 landscape)=video@ipad|Phone (390 × 844)=video@phone}}

### Gifts

{{compare:iPad (1180 × 820 landscape)=gifts@ipad|Phone (390 × 844)=gifts@phone}}

### Brainy

{{compare:iPad (1180 × 820 landscape)=brainy@ipad|Phone (390 × 844)=brainy@phone}}

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
this report captures. Recorded in Chromium; `pnpm e2e` covers Chromium and WebKit.
