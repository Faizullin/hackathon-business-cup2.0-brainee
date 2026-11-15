# Docs map

Read only what your task needs. Each fact lives in exactly one file; other files link to it.

## Folders

| Folder | Contains | Read when | Updated by |
|---|---|---|---|
| [progress/](progress/) | Current status, backlog, session log | **Every session start** (status.md) | Whoever finishes work |
| [product/](product/) | What we build: condensed PRD | Building a feature or checking a rule | Product owner; anyone fixing a spec gap |
| [dev/](dev/) | How we build: stack, setup, conventions, decisions | Scaffolding, adding packages, onboarding | Whoever changes the architecture |
| [plans/](plans/) | Ordered implementation plans for larger efforts | Starting a planned effort (e.g. the redesign) | Whoever plans or finishes the effort |
| [reports/](reports/) | Generated UI walkthroughs, videos, screenshots and logs | Reviewing current UI or recording a demo | Whoever changes a report scenario |

## Files

| File | One-line purpose |
|---|---|
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
| [reports/README.md](reports/README.md) | Recording commands, artifact map and analysis of the game-store-planning reporting pipeline |
| [product/routes-spec.md](product/routes-spec.md) | Building or changing routes, access, parent dashboard or ROUTES.md rules |
| [product/design.md](product/design.md) | **Visual source of truth** (Claude Design lavender): tokens, motion, Brain component spec and Brainy mapping, screen patterns, game palette |
| [product/funnel.md](product/funnel.md) | Building or testing the parent funnel (Brain Check sales quiz at `/start`): screens, brain meter, offer, one-tap start, Starter Pack |
| [plans/redesign.md](plans/redesign.md) | Implementing the redesign: ordered tasks T-130–T-142, ground rules, open owner questions |
| [product/external-games.md](product/external-games.md) | Planning the 30-game pack (licences, path C, first wave) |
| [reports/mvp.md](reports/mvp.md) | Every MVP page (child + parent): phone/iPad walkthrough videos, screenshots, JSON logs. Also [reports/learning.md](reports/learning.md) (three-game loop) |

## Reading paths by task

- **Turn a podcast into a film** → `dev/films.md` (whole workflow) → `packages/films/src/art.tsx` for art keys
- **Build or port a game** → `dev/games.md` → the game catalog and contract → its pinned source or manifest
- **Build a child screen** → `screens.md` (that section) → `dev/ui.md` → `mechanics.md` if it touches stars or stats
- **Build parent analytics** → `screens.md` §Parent → `data-model.md`
- **Write economy or stat logic** → `mechanics.md` → `data-model.md` §How stats change
- **Save games or wire shared state** → `dev/sessions.md` → `product/data-model.md` → `dev/setup.md`
- **Infra, auth or deploy** → `architecture.md` → `rules.md` §Technical requirements → `decisions.md`
- **Redesign or parent funnel** → `plans/redesign.md` → `product/design.md` → `product/funnel.md` → `dev/ui.md`
- **Demo prep** → `rules.md` §Acceptance criteria → `status.md`

## Original sources

Frozen inputs are kept out of the tree and read from git history (`git show <commit>:<path>`). This repository's maintained specifications replace them.

| Source | In git history | Maintained in |
|---|---|---|
| PRD (24-page PDF), single-file clickable prototype | `b1a3c68:docs/ideas/` | [product/](product/); prototype ported into `packages/brainy`, `packages/games`, `packages/core`, `apps/web` |
| `ROUTES.md` + `brainy-mvp.zip` (routes, roles, rules, clickable MVP) | `b1a3c68:docs/ideas/` | [product/routes-spec.md](product/routes-spec.md) |
| 30-game handoff (catalog, pinned sources, launcher) | `b1a3c68:docs/ideas/` | [product/external-games.md](product/external-games.md) |
| Claude Design lavender files (`claude-design/*.dc.html`) | `ca3c1d2:docs/ideas/claude-design/` | [product/design.md](product/design.md) |
| Parent funnel export (`Brainy-Funnel-Export.zip`), onboarding screenshots (`111–333.png`) | `ca3c1d2:docs/ideas/` | [product/funnel.md](product/funnel.md) |
| Brain Check funnel mockup (`brain-check-funnel-mockup.html`) | `ca3c1d2:docs/ideas/` | [product/funnel.md](product/funnel.md) |

These sources contain Russian placeholder copy and third-party font links; never ship or translate them (D-34).

## Upkeep

- `status.md` is a **snapshot**: overwrite it. `log.md` is **history**: only prepend. `todo.md` is the **backlog**: tick and add items.
- When code makes a doc out of date, fix the doc in the same change.
- New doc? Add a row to the tables above, or no one will find it.
- Mark undecided items `TBD`. Don't invent them.
