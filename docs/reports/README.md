# UI reports

[Starter screens and navigation](scaffold.md) contains two recorded walkthroughs,
six screenshots and a downloadable JSON timeline. The report documents the
current placeholders, not the planned child/parent feature set.

## Run

Install the workspace and browser binaries using [setup.md](../dev/setup.md).
Video conversion also needs `ffmpeg` (`brew install ffmpeg` on macOS).
No new npm dependencies or backend services are needed.

Start a dedicated local production server in one terminal:

```bash
pnpm build
pnpm --filter @brainee/web exec next start --hostname 127.0.0.1 --port 3123
```

In a second terminal, generate screenshots, walkthrough recordings and Markdown:

```bash
pnpm report --video
```

The command defaults to the `scaffold` module and `http://127.0.0.1:3123`.
It records Chromium at phone (390 × 844) and iPad (820 × 1180) viewport sizes,
in Russian, light theme, with timestamps shown in Asia/Almaty. Both recordings
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
pnpm report --from docs/reports/.captures/scaffold/latest

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

## Output and editing

| File | Purpose |
| --- | --- |
| [scaffold.md](scaffold.md) | Generated Markdown with clickable video posters, screenshots, checks and timelines |
| [src/scaffold.md](src/scaffold.md) | Editable narrative and `shot`, `compare`, `flow`, `verification` placeholders |
| [scenarios/scaffold.json](../../scripts/reports/scenarios/scaffold.json) | Screenshot routes, flow steps and viewport selection |
| [scenarios/scaffold.mjs](../../scripts/reports/scenarios/scaffold.mjs) | Surface checks and expected-404 recovery |
| `screens/scaffold/*.png` | Published screenshots referenced by the Markdown |
| [Phone MP4](videos/scaffold/phone-walkthrough.mp4), [iPad MP4](videos/scaffold/ipad-walkthrough.mp4) | H.264 recordings, each with a JPEG poster |
| [logs/scaffold.json](logs/scaffold.json) | Published timed steps, checks, console/network issues and bridge messages |
| `.captures/scaffold/latest/` | Ignored raw screenshots, manifest, source commit/dirty marker, HTML contact sheet and PDF |
| `.captures/scaffold/flows/<flow>/` | Ignored per-flow timeline and recordings; inspect these when a flow fails |
| `.captures/scaffold/run-state.json`, `run.log` | Progress and diagnostics for the last run |

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
[report guide](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/docs/reports/README.md)
and [Shape Match report](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/docs/reports/shape-match.md)
demonstrate a useful separation: fresh per-route screenshots plus continuous,
checked app sessions, assembled into a committed Markdown report.

| Existing part | Reused here |
| --- | --- |
| [report.mjs](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/scripts/report.mjs) | CLI, module selection, fixture resolution, progress, lock, saved-capture rendering |
| [web.mjs](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/scripts/reports/web.mjs) | Playwright screenshots, interaction DSL, continuous flows, optional bridge logging, HTML/PDF raw reports |
| [timeline.mjs](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/scripts/reports/timeline.mjs) | Timed entries; PASSED requires checks, CAPTURED means no checks, errors mean FAILED |
| [media.mjs](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/scripts/reports/media.mjs) | Playwright WebM → H.264 MP4 with fast-start metadata, even dimensions and JPEG poster |
| [generate.mjs](https://github.com/Faizullin/pecs-game-store/blob/13f8eff476b1bfe45ce0f3b2d3646b17613ab52b/scripts/reports/generate.mjs) | Template expansion, capture/asset validation, clickable video posters, JSON timelines and scoped cleanup |
| `core.test.mjs`, `web.test.mjs` | Generator failure/containment tests and real-browser fixture captures, checked flows and video conversion |

The local port resolves `apps/web`'s pinned `@playwright/test` instead of using
global npm installations. It adds phone/iPad presets, Russian capture labels,
foreign-origin request failures, strict video conversion and working Markdown
links to logs. It uses Biome formatting and has no runtime dependency on the
sibling checkout. Upstream's PECS-specific modules, fixtures, login configuration
and cross-repository sync are not registered here.

Screenshot publication rejects failed steps, navigation/HTTP/JavaScript errors,
unexpected request failures, missing/duplicate viewports, missing assets and
escaping asset paths. Flows retain console errors and 4xx responses as warnings;
uncaught exceptions, unexpected request failures, 5xx responses, failed checks,
foreign-origin requests and recording conversion failures make them FAILED.
The scaffold's expected 404 is checked explicitly and retained in the log.
Do not interpret PASSED as a general accessibility or security audit.

This is a local tooling port under [D-14](../dev/decisions.md#d-14--port-local-ui-recordings-and-markdown-reports--2026-11-14--accepted).
Browser-engine regression tests remain `pnpm e2e`; real-device verification
remains [T-62](../progress/todo.md).
