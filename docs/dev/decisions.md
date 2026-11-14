# Decisions (ADR log)

Newest first. One short entry per decision. To change a decision, add a new entry that supersedes the old one; only the old entry's status line may change.

Format: `## D-NN · Title · YYYY-MM-DD · status` → Context / Decision / Consequences.

---

## D-20 · Server snapshots and retained finish IDs replace local awards · 2026-11-14 · accepted · supersedes D-17, extends D-15/D-18
**Context:** the child preview could not restore saved rewards or observe another device, and a replayed receipt may contain an older balance.
**Decision:** one consistent versioned snapshot, TanStack Query polling and explicit loading/recovery UI. Host-issued games submit stable IDs; only pending result envelopes use tab storage. A finish requires server acknowledgement and a fresh state read before the completion UI. The full contract is in [sessions.md](sessions.md#shared-state-and-client-recovery-t-55). Poll/cancellation behavior follows [TanStack's polling guide](https://tanstack.com/query/latest/docs/framework/react/guides/polling).
**Consequences:** no browser-side rewards or preview migration; connected child screens require the prepared opt-in demo database. Accessory/goal presentation is still a fixture. Parent wiring remains behind its barrier. Tests use one worker for the shared seeded child; no test reset endpoint or infrastructure is added.

## D-19 · Keep pinned SQLite tooling compatible with concurrent demo writes · 2026-11-14 · accepted
**Context:** regression tests reproduced a failed-BEGIN/COMMIT statement remaining active in the native libSQL binding and duplicate index creation during repeated Drizzle Kit pushes with CHECK constraints. Upstream reports: [libSQL #361](https://github.com/tursodatabase/libsql-client-ts/issues/361), [Drizzle #4574](https://github.com/drizzle-team/drizzle-orm/issues/4574).
**Decision:** apply a pnpm patch to `@libsql/client@0.18.0` (ESM and CJS) so transaction controls use native `exec`, preserving error mapping. Use one configured native handle per request-owned client, WAL, and bounded whole-transaction SQLITE_BUSY retries. Keep optional secondary indexes/email uniqueness out of the demo schema while the pinned Kit rebuild bug persists.
**Consequences:** no dependency upgrade or new service. Independent-connection concurrency and parallel FK writes are tested; repeated pushes retain state/history/access references. Remove the patch and restore indexes only when replacement versions pass these regressions (T-92).

## D-18 · Server-issued demo games and atomic completion receipts · 2026-11-14 · accepted · extends D-07/D-17
**Context:** the connected demo needs durable rewards and repeat-safe finishes before UI polling is wired.
**Decision:** explicit demo opt-in, an opaque cookie stored as a hash, a server-issued pending game ID, strict core result validation, and a transaction saving rewards/state/history/version together. Retries return an immutable receipt. Contract and trust boundaries: [sessions.md](sessions.md).
**Consequences:** API data survives requests/process restarts; no auth provider or shared server memory. The parent PIN and current-state polling are separate follow-ups; the existing UI preview is unchanged.

## D-17 · Per-tab learning preview before server rewards · 2026-11-14 · superseded by D-20
**Context:** T-35 must demonstrate changed Brainy/wallet state across child and fullscreen game routes before T-54 persistence exists.
**Decision:** a root client provider calls pure core transitions and keeps a transient per-tab snapshot; no API writes or shared server memory. The storage, stopping and replacement boundary is documented in [ui.md](ui.md#temporary-learning-preview-t-35).
**Consequences:** the child flow is reviewable now. Cross-device proof, trusted rewards and replay protection still require the [demo data slice](../progress/todo.md#smallest-end-to-end-demo-slice-t-80); the preview must be replaced, not treated as persistence.

## D-16 · Game catalog scales by artifacts: three paths, one contract · 2026-11-14 · accepted · extends D-10/D-11/D-12
**Context:** games may come in large numbers, from other repos, teams and engines; the D-12 plan assumed all game source lives in this monorepo.
**Decision:** the app consumes **built artifacts + manifests**, not source. Path A = React folders (`packages/games`), path B = in-repo engine packages (`games/*`), path C = external pinned, checksummed build artifacts imported by version. Manifests are schema-validated and fill `Game`/`GameVersion` in the DB; the bridge is versioned (host supports N and N−1); every game must pass one conformance suite before it is listed; isolation follows trust tiers. Details: [games.md](games.md#scaling-three-paths-in-one-contract-d-16).
**Consequences:** adding games needs no app code (except path A); any engine fits behind an adapter; per-version rollback. Costs later: manifest schema, `GameVersion` table, conformance suite, artifact import (T-89 – T-91). Hackathon scope stays A + B.

## D-15 · Deploy last, on free tiers: Vercel Hobby + Turso via Drizzle; sync by polling · 2026-11-14 · accepted · supersedes D-06 and the SSE part of D-04
**Context:** deployment isn't needed until the demo, and only free options are allowed. Vercel Hobby is free but serverless, with no persistent disk and no shared memory, so a SQLite file and an in-process SSE bus won't survive there. Drizzle already talks to libSQL, and Turso hosts libSQL on a free plan.
**Decision:** develop **local-only** until the end. The final roadmap step (T-14) deploys `apps/web` to **Vercel Hobby** (free `<project>.vercel.app` domain, which is allowlistable in Screen Time; no paid custom domain) with the database on **Turso's free plan** through the same `drizzle-orm/libsql` driver (`DATABASE_URL=libsql://…` + `DATABASE_AUTH_TOKEN`). **Live sync uses short polling** (TanStack Query, ~3 s, version check), the same locally and on serverless. No long-lived SSE functions. Media stays in `public/` (served from our domain).
**Consequences:** no deployment work or infrastructure until the last step. Code must not assume one long-running process or a writable disk. `getDatabaseConfig` accepts only `file:` today and will be extended in T-14. Hobby is for non-commercial use: fine for the hackathon, revisit for a commercial launch.

## D-14 · Port local UI recordings and Markdown reports · 2026-11-14 · accepted
**Context:** `../game-store-planning` already records checked Playwright flows and renders Markdown with screenshots, MP4 posters and JSON timelines. We need the same review artifacts for the current scaffold.
**Decision:** port its local report CLI, browser driver, generator, timeline/media helpers and tests into `scripts/`. Resolve the existing pinned Playwright from `apps/web`; use local ffmpeg for video conversion. Register a Russian scaffold scenario at phone/iPad viewport sizes and commit generated artifacts under `docs/reports`.
**Consequences:** no new npm dependencies, service or client requests. The port runs without the sibling checkout; its provenance and local adaptations are in [reports/README.md](../reports/README.md). Raw captures stay ignored. Recordings complement Chromium/WebKit e2e and do not replace real-device checks.

## D-13 · App-like UI: shadcn on Base UI + layered motion · 2026-11-14 · accepted · refines the styling/animation rows of D-01
**Context:** we want a rich, animated, native-feeling mobile UI. Base UI v1 now covers what we need, including a swipeable Drawer with snap points (shadcn moved its drawer from Vaul to Base UI). `game-store-planning` already used `@base-ui/react`. The installed React 19.3.1 exports `ViewTransition`, and Next 16.4.6 documents it for the App Router.
**Decision:** shadcn/ui with a `base-*` style for every interactive component, child and parent alike, restyled with the prototype tokens in `packages/ui`. Motion in four layers: CSS → React `<ViewTransition>` for routes and shared elements → Motion (`LazyMotion`) for physics, gestures and rewards. Layouts own the persistent chrome; the root layout has no visual chrome; game screens are fullscreen. Details: [ui.md](ui.md).
**Consequences:** one accessible primitive set; no Vaul, Radix or extra page-transition libraries. Reduced motion must be handled explicitly for view transitions. Rewards stay calm and finite (product rules).

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

## D-06 · Single Node instance on Railway; media in the repo · 2026-11-14 · superseded by D-15 (media-in-repo still holds)
**Context:** a SQLite file and in-process SSE need one long-running server. Vercel serverless has neither a persistent disk nor shared memory. Object storage is extra infrastructure.
**Decision:** deploy one container (`next start`) on Railway with a volume and our custom domain. Media is served from `apps/web/public/media`.
**Consequences:** the own-domain rule is met for free; no horizontal scaling (fine for a demo). Moving to Turso or Postgres later only changes the Drizzle driver.

## D-05 · SQLite (libSQL) + Drizzle, local-first · 2026-11-14 · accepted · supersedes the Postgres part of D-01
**Context:** maximum dev speed; zero setup for every teammate and agent.
**Decision:** SQLite file via `@libsql/client` + Drizzle. `drizzle-kit push` instead of migrations; `db:reset` reseeds freely; Drizzle Studio for inspection.
**Consequences:** clone-and-run in seconds; disposable data. The same driver can point at Turso later.

## D-04 · Live sync via SSE on our own domain · 2026-11-14 · SSE superseded by D-15 (polling)
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
