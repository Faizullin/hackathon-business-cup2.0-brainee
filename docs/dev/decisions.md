# Decisions (ADR log)

Newest first. One short entry per decision. To change a decision, add a new entry that supersedes the old one; only the old entry's status line may change.

Format: `## D-NN · Title · YYYY-MM-DD · status` → Context / Decision / Consequences.

---

## D-12 · Port the game platform from `game-store-planning` · 2026-11-14 · accepted · refines D-11, supersedes the game-lab app (D-08)
**Context:** our earlier repo `../game-store-planning` already has a tested any-engine bridge (`bridge-core`: MessageChannel handshake, zod validation, engine adapters, IIFE drop-in), engine build kits (esbuild for Phaser, `gdexporter` for GDevelop), a manifest → build → `public/` → DB seed pipeline, asset checks, and Chromium + WebKit e2e that caught real iPad-relevant bugs.
**Decision:** port these instead of the protocol drafted in D-11. Strip the PECS-specific parts. Embedded games become workspace packages under `games/`, with shared `engine-phaser` / `engine-gdevelop` kits. GDevelop projects are committed as editable source and exported at build time. Manifests seed the `Game` table (no generated TS registry). The lab is a dev-only `/lab` route, not a separate Vite app. Dropped: the `git` import source, `adapter.js` injection, the games subdomain.
**Consequences:** less to build and fewer apps; proven WebKit fixes from the start. 3–5 existing games are candidates to reuse. We inherit GSP's protocol vocabulary.

## D-11 · Two game runtimes: React + embedded (any engine) via a bridge · 2026-11-14 · accepted (runtimes) · protocol, sources and registry superseded by D-12
**Context:** games may be built with Phaser, GDevelop, vanilla JS or come from other git repos. D-10 treated iframes as a rare fallback.
**Decision:** `GameDefinition` is a union of `runtime: 'react'` (folders in `packages/games`, per D-10) and `runtime: 'embedded'` (`games/<id>/` with `game.json`, static `dist/` served from `/games/<id>/` in a same-origin iframe). Embedded games talk through a versioned `postMessage` protocol with a dependency-free SDK (`packages/game-bridge`: ESM + IIFE `bridge.js`, plus a standalone debug mode). Sources: `workspace` (built by Turbo), `export` (committed editor export), `git` (pinned SHA, imported and built, `dist/` committed). Games we can't modify get an `adapter.js`. Engine games, Phaser included, run embedded.
**Consequences:** any engine fits without changing the app; reliable teardown (good for the 10-min fun-game timer); engines stay out of the main bundle. Costs: the bridge, the collect step and a network audit per game. Same-origin iframes aren't a security boundary, so only audited code goes in (subdomain isolation is T-86). Details: [games.md](games.md).

## D-10 · Games: folders in one package, React components, no iframes · 2026-11-14 · accepted for React games · iframe part superseded by D-11
**Context:** we compared one `packages/games` with a folder per game, a workspace package per game, and an iframe per game.
**Decision:** folders in one package, each self-contained (imports only `kit`, `core`, npm); a lazy registry (`load()` → one chunk per game); the app renders games as React components and the `onFinish` callback is the only bridge. Promote a game to its own package only when it needs heavy dependencies or separate ownership. Add an `IframeGame` adapter only for non-React standalone games.
**Consequences:** zero per-game setup; the same code splitting as separate packages; a clear upgrade path with no change to the app. Compared options: one package with folders, a package per game, an iframe per game. See [games.md](games.md).

## D-09 · Agent skills: a curated set, not everything · 2026-11-14 · accepted
**Context:** popular UI prompts list many skills; each one costs context and some fight our existing design.
**Decision:** adopt webapp-testing, vercel-react-best-practices, frontend-design (limited to prototype tokens); use web-design-guidelines, Motion Primitives and Magic UI on demand; skip ui-ux-pro-max and vercel-composition-patterns. Details: [agent-tooling.md](agent-tooling.md).
**Consequences:** consistent visual identity; lower token use.

## D-08 · Game contract + game-lab sandbox + generator · 2026-11-14 · accepted · game-lab app superseded by D-12 (`/lab` route)
**Context:** many games are being built locally by different people and agents, and must behave the same way in the product.
**Decision:** one `GameDefinition` / `GameResult` contract in `packages/games` (types in `core`); a Vite `apps/game-lab` for isolated development; `pnpm gen:game` Turborepo generator. Games report results; `core` grants rewards.
**Consequences:** a game that works in the lab works in the app; parallel work without merge conflicts (one folder per game).

## D-07 · Demo session first, real auth later · 2026-11-14 · accepted
**Context:** auth adds little to a hackathon demo and costs time.
**Decision:** seeded demo family + cookie session (`DEMO_MODE`) + parent PIN barrier. Better Auth (works with SQLite + Drizzle) is a stretch goal.
**Consequences:** no sign-up flow at first; the quiz still runs against the demo child.

## D-06 · Single Node instance on Railway; media in the repo · 2026-11-14 · accepted · supersedes deploy and media parts of D-01/D-04
**Context:** a SQLite file and in-process SSE need one long-running server. Vercel serverless has neither a persistent disk nor shared memory. Object storage is extra infrastructure.
**Decision:** deploy one container (`next start`) on Railway with a volume and our custom domain. Media is served from `apps/web/public/media`.
**Consequences:** the own-domain rule is met for free; no horizontal scaling (fine for a demo). Moving to Turso or Postgres later only changes the Drizzle driver.

## D-05 · SQLite (libSQL) + Drizzle, local-first · 2026-11-14 · accepted · supersedes the Postgres part of D-01
**Context:** maximum dev speed; zero setup for every teammate and agent.
**Decision:** SQLite file via `@libsql/client` + Drizzle. `drizzle-kit push` instead of migrations; `db:reset` reseeds freely; Drizzle Studio for inspection.
**Consequences:** clone-and-run in seconds; disposable data. The same driver can point at Turso later.

## D-04 · Live sync via SSE on our own domain · 2026-11-14 · accepted
**Context:** the parent must see the child's progress without reloading. Supabase Realtime and Firebase run on third-party domains that the Screen Time allowlist blocks.
**Decision:** use a Server-Sent Events endpoint in `apps/web`, with polling as a fallback.
**Consequences:** no extra vendor; reconnects have to be handled on our side. (D-06 makes an in-process event bus enough.)

## D-03 · All logic in a pure `packages/core` · 2026-11-14 · accepted
**Context:** the economy, stats and recommendation rules are the product, and their formulas are still TBD.
**Decision:** keep these as pure TypeScript functions with Vitest tests. The UI and API only call them.
**Consequences:** easy to tune and demo; one place to change the formulas.

## D-02 · One app for child + parent · 2026-11-14 · accepted
**Context:** the child switches to the parent dashboard on the same device through a PIN barrier, and both show the same live Brainy.
**Decision:** a single Next.js app with `(child)` and `(parent)` route groups; a separate `landing` app only for marketing.
**Consequences:** one session, one domain to allowlist, fewer deploys.

## D-01 · TypeScript monorepo (pnpm + Turborepo, Next.js) · 2026-11-14 · accepted · DB part superseded by D-05, deploy/media by D-06
**Context:** hackathon speed, several surfaces (PWA, landing, games) sharing the Brainy renderer and the rules.
**Decision:** pnpm workspaces + Turborepo. Next.js handles both UI and API, so server code also runs on our own domain. ~~Postgres, Vercel, R2~~.
**Consequences:** shared types end to end. Firebase, Clerk and client-side Supabase are ruled out because of the allowlist.
