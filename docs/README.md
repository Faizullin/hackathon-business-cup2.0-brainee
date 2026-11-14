# Docs map

Read only what your task needs. Each fact lives in exactly one file; other files link to it.

## Folders

| Folder | Contains | Read when | Updated by |
|---|---|---|---|
| [progress/](progress/) | Current status, backlog, session log | **Every session start** (status.md) | Whoever finishes work |
| [product/](product/) | What we build: condensed PRD | Building a feature or checking a rule | Product owner; anyone fixing a spec gap |
| [dev/](dev/) | How we build: stack, setup, conventions, decisions | Scaffolding, adding packages, onboarding | Whoever changes the architecture |
| [ideas/](ideas/) | Original sources: PRD PDF, HTML prototype | Porting prototype code (line map inside) | Rarely; sources are frozen |
| [reports/](reports/) | Generated UI walkthroughs, videos, screenshots and logs | Reviewing current UI or recording a demo | Whoever changes a report scenario |

## Files

| File | One-line purpose |
|---|---|
| [pitch.md](pitch.md) | Ten-slide US-first outline and three-minute speaker script |
| [demo.md](demo.md) | One-minute jury path, reset-first two-device presentation and rehearsal checks |
| [progress/status.md](progress/status.md) | Phase dashboard, current focus, **handoff note** |
| [progress/todo.md](progress/todo.md) | Backlog checklist with task IDs (T-xx) |
| [progress/log.md](progress/log.md) | Append-only session history, newest first |
| [product/overview.md](product/overview.md) | Problem, solution, roles, MVP goals, scope, open questions |
| [product/mechanics.md](product/mechanics.md) | ★/☀ economy, Brainy stats, stages, mood, accessories, quiz |
| [product/screens.md](product/screens.md) | Every child and parent screen, game catalog, entry algorithm |
| [product/data-model.md](product/data-model.md) | Entities, how stats change, analytics events |
| [product/rules.md](product/rules.md) | Device lockdown, own-domain requirement, privacy, product rules, **acceptance criteria** |
| [dev/architecture.md](dev/architecture.md) | Stack, monorepo layout, package responsibilities |
| [dev/decisions.md](dev/decisions.md) | Why we chose what we chose (ADR log) |
| [dev/setup.md](dev/setup.md) | Install, run, env vars, iPad testing (deploy = final step) |
| [dev/sessions.md](dev/sessions.md) | Demo cookie, issued sessions, atomic rewards, state polling and retry/reload recovery |
| [dev/conventions.md](dev/conventions.md) | Code style, naming, testing, git |
| [dev/games.md](dev/games.md) | Game runtimes, bridge + engine kits to port from game-store-planning, testing, reusable games |
| [dev/films.md](dev/films.md) | Interactive films: mp3 + JSON script format, podcast → film workflow, art rules, checks, player |
| [dev/ui.md](dev/ui.md) | UI and motion system: Base UI components, page transitions, Motion, app shell, mobile app-feel checklist |
| [dev/agent-tooling.md](dev/agent-tooling.md) | Which agent skills and MCP servers to use or skip, and why |
| [ideas/README.md](ideas/README.md) | What the source files are + prototype line map |
| [reports/README.md](reports/README.md) | Recording commands, artifact map and analysis of the game-store-planning reporting pipeline |
| [product/routes-spec.md](product/routes-spec.md) | Building or changing routes, access, parent dashboard or ROUTES.md rules |
| [product/external-games.md](product/external-games.md) | Planning the 30-game pack (licences, path C, first wave) |
| [reports/mvp.md](reports/mvp.md) | Every MVP page (child + parent): phone/iPad walkthrough videos, screenshots, JSON logs. Also [reports/learning.md](reports/learning.md) (three-game loop) |

## Reading paths by task

- **Turn a podcast into a film** → `dev/films.md` (whole workflow) → `packages/films/src/art.tsx` for art keys
- **Build or port a game** → `dev/games.md` → that game's row in `screens.md` → prototype lines 901–982
- **Build a child screen** → `screens.md` (that section) → `dev/ui.md` → `mechanics.md` if it touches stars or stats → prototype range from `ideas/README.md`
- **Build parent analytics** → `screens.md` §Parent → `data-model.md`
- **Write economy or stat logic** → `mechanics.md` → `data-model.md` §How stats change
- **Save games or wire shared state** → `dev/sessions.md` → `product/data-model.md` → `dev/setup.md`
- **Infra, auth or deploy** → `architecture.md` → `rules.md` §Technical requirements → `decisions.md`
- **Demo prep** → `rules.md` §Acceptance criteria → `status.md`

## Upkeep

- `status.md` is a **snapshot**: overwrite it. `log.md` is **history**: only prepend. `todo.md` is the **backlog**: tick and add items.
- When code makes a doc out of date, fix the doc in the same change.
- New doc? Add a row to the tables above, or no one will find it.
- Mark undecided items `TBD`. Don't invent them.
