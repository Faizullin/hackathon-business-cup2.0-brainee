# UI reports

| Report | Shows |
| --- | --- |
| [Every MVP page](mvp.md) (default) | Brain Check funnel (quiz, result, plan, offer), Entry, Learn, Leisure, Gifts, Brainy shop, Path, parent PIN, Analytics, Tasks, Gifts & goal. Two walkthroughs, 24 screenshots |
| [Saved child learning loop](learning.md) | Three saved games without returning to the menu, post-game screens, the three-game break bonus, the Brainy tab, child tabs and `/lab`. Two walkthroughs, 12 screenshots |

The earlier `scaffold` report (placeholder screens) was retired once every page existed.

## Run

Install the workspace and browser binaries using [setup.md](../dev/setup.md).
Video conversion also needs `ffmpeg` (`brew install ffmpeg` on macOS).
No new npm dependencies or backend services are needed.

Start a dedicated local production server in one terminal:

```bash
pnpm build
pnpm --filter @brainee/web exec next start --hostname 127.0.0.1 --port 3123
```

Both modules need the demo session, the lab and a
freshly reset database (any local `file:` path works):

```bash
export DATABASE_URL=file:///tmp/brainee-report.db
pnpm --filter @brainee/db db:reset
DEMO_MODE=1 BRAINEE_LAB=1 pnpm --filter @brainee/web exec next start --hostname 127.0.0.1 --port 3123
```

In a second terminal, generate screenshots, walkthrough recordings and Markdown:

```bash
pnpm report --video                   # mvp (default module): every page
pnpm report --module learning --video # saved child learning loop
```

The command defaults to the `mvp` module and `http://127.0.0.1:3123`.
It records WebKit at phone (390 × 844) and iPad (1180 × 820) viewport sizes,
in English, light theme, with timestamps shown in America/New_York. Both recordings
show the same continuous flow. `--video` requires successful MP4 conversion;
conversion errors fail the run instead of silently publishing a video-less report.

```bash
pnpm report --list
pnpm report --status
pnpm report --status --watch

# After the first full run, refresh just screenshots or one recording:
pnpm report --shots
pnpm report --flow phone-walkthrough --video
pnpm report --flows --video --headed

# Render saved captures without opening a browser:
pnpm report --from docs/reports/.captures/mvp/latest

# Use another local server, such as the development server:
pnpm report --base http://localhost:3000 --video

# Tooling tests (includes fixture-site browser/video integration and link checks):
pnpm test:reports
```

`REPORT_BASE_URL` is an alternative to `--base`. Only localhost, `127.0.0.1`
and `[::1]` targets are accepted. A partial run renders using the other flows
and screenshots saved by the previous full run; each flow keeps its own timestamp.
Without `--video`, newly captured flows explicitly say they have no recording
and replace their previous videos. `--viewport phone|ipad|desktop|mobile` can
override flow viewports; the generated result names the viewport actually used.
Rebuild before recording source changes when using a production server.

### MVP module

The flow first calls `POST /api/demo-reset` (DEMO_MODE only) to restore seeded tasks,
gifts and videos, with parent authorization, then locks parent access, plays the child flow and enters parent mode with PIN `1234`.
Saved activity analytics are live; historical/character radars and ranking remain labelled demo (D-29).

### Learning module

Reset the database before each `learning` run: the flows play three games in
a row on the seeded child, so earlier runs change the recorded balances. The
walkthrough actions answer games only from what a child sees (the unique SVG,
or trying pattern answers in order) and add no test hooks to the games.

## Output and editing

| File | Purpose |
| --- | --- |
| [mvp.md](mvp.md), [learning.md](learning.md) | Generated Markdown with clickable video posters, screenshots, checks and timelines |
| [src/mvp.md](src/mvp.md), [src/learning.md](src/learning.md) | Editable narrative and `shot`, `compare`, `flow`, `verification` placeholders |
| [scenarios/mvp.json](../../scripts/reports/scenarios/mvp.json), [learning.json](../../scripts/reports/scenarios/learning.json) | Screenshot routes, flow steps and viewport selection |
| [mvp.mjs](../../scripts/reports/scenarios/mvp.mjs), [learning.mjs](../../scripts/reports/scenarios/learning.mjs), [common.mjs](../../scripts/reports/scenarios/common.mjs) | Walkthrough actions (`call` steps) and shared surface checks |
| `screens/<module>/*.png` | Published screenshots referenced by the Markdown |
| [Phone MP4](videos/mvp/phone-mvp.mp4), [iPad MP4](videos/mvp/ipad-mvp.mp4) | H.264 recordings, each with a JPEG poster |
| [logs/mvp.json](logs/mvp.json) | Published timed steps, checks, console/network issues and bridge messages |
| `.captures/<module>/latest/` | Ignored raw screenshots, manifest, source commit/dirty marker, HTML contact sheet and PDF |
| `.captures/<module>/flows/<flow>/` | Ignored per-flow timeline and recordings; inspect these when a flow fails |
| `.captures/<module>/run-state.json`, `run.log` | Progress and diagnostics for the last run |

Edit the template and scenario, then regenerate. Do not hand-edit the generated
report. Commit the Markdown, PNGs, MP4s, JPEG posters and JSON log together so
links work in a fresh checkout. Raw captures are ignored.

New modules belong in [modules.mjs](../../scripts/reports/modules.mjs), with a
scenario and `src/<module>.md` template. The runner captures screenshots before
flows, validates the captures, then replaces that module's published artifacts.
Failed flows and invalid screenshot captures leave the previous report intact.
Only the module's generated PNG/MP4/JPEG files are pruned; other modules and
handwritten source files are kept. The per-module process lock prevents
simultaneous writers.

## Analysis of game-store-planning

Inspected the sibling checkout `../game-store-planning` at
`13f8eff476b1bfe45ce0f3b2d3646b17613ab52b`. Its
`docs/reports/README.md`
and `docs/reports/shape-match.md`
demonstrate a useful separation: fresh per-route screenshots plus continuous,
checked app sessions, assembled into a committed Markdown report.

| Existing part | Reused here |
| --- | --- |
| `scripts/report.mjs` | CLI, module selection, fixture resolution, progress, lock, saved-capture rendering |
| `scripts/reports/web.mjs` | Playwright screenshots, interaction DSL, continuous flows, optional bridge logging, HTML/PDF raw reports |
| `scripts/reports/timeline.mjs` | Timed entries; PASSED requires checks, CAPTURED means no checks, errors mean FAILED |
| `scripts/reports/media.mjs` | Playwright WebM → H.264 MP4 with fast-start metadata, even dimensions and JPEG poster |
| `scripts/reports/generate.mjs` | Template expansion, capture/asset validation, clickable video posters, JSON timelines and scoped cleanup |
| `core.test.mjs`, `web.test.mjs` | Generator failure/containment tests and real-browser fixture captures, checked flows and video conversion |

The local port resolves `apps/web`'s pinned `@playwright/test` instead of using
global npm installations. It adds phone/iPad presets, English capture labels,
foreign-origin request failures, strict video conversion and working Markdown
links to logs. It uses Biome formatting and has no runtime dependency on the
sibling checkout. Upstream's PECS-specific modules, fixtures, login configuration
and cross-repository sync are not registered here.

Screenshot publication rejects failed steps, navigation/HTTP/JavaScript errors,
unexpected request failures, missing/duplicate viewports, missing assets and
escaping asset paths. Flows retain console errors and 4xx responses as warnings;
uncaught exceptions, unexpected request failures, 5xx responses, failed checks,
foreign-origin requests and recording conversion failures make them FAILED.
The shared `recoverMissing` check expects a 404 and keeps it in the log.
Do not interpret PASSED as a general accessibility or security audit.

This is a local tooling port under [D-14](../dev/decisions.md#d-14--port-local-ui-recordings-and-markdown-reports--2026-11-14--accepted).
WebKit captures do not generate a PDF (Playwright only supports PDF in Chromium); the HTML contact sheet and published images/videos remain available. `english.spec.ts` checks that host pages and every embedded game contain no Cyrillic.

Browser-engine regression tests remain `pnpm e2e`; real-device verification
remains [T-62](../progress/todo.md).
