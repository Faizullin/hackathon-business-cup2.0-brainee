# Brainee: saved child learning loop

The implemented child features, recorded from a local production build with
`DEMO_MODE=1`, `BRAINEE_LAB=1` and a freshly reset seeded database. Rewards and
Brainy stats are saved through the session API and read back by polling. The
parent view, entry screen, Leisure and Gifts are not implemented yet.
[Run instructions](README.md#learning-module).

## Recordings

Each walkthrough starts on «Учимся» and plays three games without returning to
the menu: Continue the pattern from the grid, then the «Подтянуть навык» card
(a game for the weakest skill), then the «Следующий уровень» card. Each
post-game screen shows stars and Brainy before → after. The third adds the
+5 ★ bonus and «Сделать перерыв», which ends on the Brainy tab with a
thank-you. Then it checks the updated wallet and visits the other tabs.
Continue the pattern is answered by trying options in order, so wrong tries
show the hint «Почти!» and the correction star.

### Phone · 390 × 844

{{flow:phone-learning}}

### iPad viewport · 1180 × 820 landscape

{{flow:ipad-learning}}

Recorded in Chromium at the named viewport sizes. `pnpm e2e` covers Chromium
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
