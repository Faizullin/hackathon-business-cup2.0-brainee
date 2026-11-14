# Brainee: saved child learning loop

The implemented child features, recorded from a local production build with
`DEMO_MODE=1`, `BRAINEE_LAB=1` and a freshly reset seeded database. Rewards and
Brainy stats are saved through the session API and read back by polling. The
full child/parent walkthrough is in the [MVP report](mvp.md).
[Run instructions](README.md#learning-module).

## Recordings

Each English walkthrough starts on Learn, plays Continue the Pattern from the
grid, opens Odd One Out directly, then chooses its next level. Each post-game
screen shows stars and Brainy before → after. The third finish adds the +5 ★
break bonus; “Take a break” ends on the Brainy tab. The flow checks the updated
wallet and visits the other child tabs. Pattern answers are tried in order to
exercise hints and correction rewards. Achievement celebrations are dismissed
before continuing. The weak-skill card is shown; its iframe game is outside
this native-game recording helper. The games-owned loading text may still appear
in Russian briefly; T-112 belongs to the separate games session.

### Phone · 390 × 844

{{flow:phone-learning}}

### iPad viewport · 1180 × 820 landscape

{{flow:ipad-learning}}

Recorded in WebKit with English UI and New York time at the named viewport sizes. `pnpm e2e` covers Chromium
and WebKit; this is not a real-device or Screen Time test.

## Screenshots

### Learn

{{compare:iPad (1180 × 820 landscape)=learn@ipad|Phone (390 × 844)=learn@phone}}

### Odd one out

{{compare:iPad (1180 × 820 landscape)=odd-one-out@ipad|Phone (390 × 844)=odd-one-out@phone}}

### Continue the pattern, level 2

{{compare:iPad (1180 × 820 landscape)=continue-pattern@ipad|Phone (390 × 844)=continue-pattern@phone}}

### Brainy tab

{{compare:iPad (1180 × 820 landscape)=brainy@ipad|Phone (390 × 844)=brainy@phone}}

### Developer lab (`/lab`, not in the product)

{{compare:iPad (1180 × 820 landscape)=lab@ipad|Phone (390 × 844)=lab@phone}}

{{compare:iPad (1180 × 820 landscape)=lab-brainy@ipad|Phone (390 × 844)=lab-brainy@phone}}

## Logs and capture checks

[Download the flow timelines (JSON)](logs/learning.json).

{{verification}}

The editable [template](src/learning.md), [scenario](../../scripts/reports/scenarios/learning.json)
and [walkthrough actions](../../scripts/reports/scenarios/learning.mjs) define
what this report captures.
