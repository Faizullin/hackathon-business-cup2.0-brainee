# Brainee: starter screens and navigation

The current `/learn`, `/analytics`, `/login` and missing-page screens, recorded
from the local production build. These are scaffold placeholders: this report
does not demonstrate authentication, parent protection, games or rewards.
[Run instructions and source analysis](README.md).

## Recordings

Each continuous walkthrough starts at `/login`, follows "К занятиям" to
`/learn`, opens `/analytics` directly, then opens a missing route and follows
its return link. The analytics and missing-route visits use direct navigation
because the scaffold has no navigation between those screens yet. Checks cover
headings, Russian document language, loaded fonts and horizontal overflow.

### Phone · 390 × 844

{{flow:phone-walkthrough}}

### iPad viewport · 820 × 1180

{{flow:ipad-walkthrough}}

These recordings use Chromium at the named viewport sizes. The separate
`pnpm e2e` suite covers Chromium and WebKit; an iPad viewport is not evidence
of a real-device Screen Time test.

## Screenshots

### Learning

{{compare:iPad (820 × 1180)=learn@ipad|Phone (390 × 844)=learn@phone}}

### Parent analytics placeholder

{{compare:iPad (820 × 1180)=analytics@ipad|Phone (390 × 844)=analytics@phone}}

### Welcome

{{compare:iPad (820 × 1180)=login@ipad|Phone (390 × 844)=login@phone}}

## Logs and capture checks

[Download the flow timelines (JSON)](logs/scaffold.json). Each flow has timed
steps, checks, console errors, network failures and optional bridge messages.
Expected HTTP 404 and browser console messages for the missing route are
retained as warnings; the walkthrough checks that the response is exactly 404.

{{verification}}

The editable [template](src/scaffold.md), [scenario](../../scripts/reports/scenarios/scaffold.json)
and [walkthrough actions](../../scripts/reports/scenarios/scaffold.mjs) define
what this report captures. Raw contact sheet, PDF, screenshot manifest and
per-flow captures remain local under `docs/reports/.captures/scaffold/`.
