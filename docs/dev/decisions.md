# Decisions (ADR log)

Newest first. One short entry per decision. To change a decision, add a new entry that supersedes the old one; only the old entry's status line may change.

Format: `## D-NN · Title · YYYY-MM-DD · status` → Context / Decision / Consequences.

---


## D-44 · Explore games are sold for ★; science films live on Learn · 2026-11-15 · accepted · narrows D-39, D-42

**Context:** Explore previews were free play beside the ★ shop, so entertainment games had two different economies, and the free science films sat in Leisure next to paid games.
**Decision:** every Explore game (built-in previews and remote R2 previews) joins each family's fun list through the existing catalog sync and is bought with the existing `unlock-fun` action: 20★ for 10 minutes or 200★ forever (Snake keeps 30/500). Play runs at `/fun/<id>` with the shared play-time timer; the game itself stays unscored and sandboxed. `/explore` redirects to Leisure. A paid remote game stays listed while its catalog is unreachable. Science films move to Learn.
**Consequences:** one entertainment economy; adding or rolling back a remote game changes the shop without a deploy. Prices are fixed in `packages/db/src/leisure-catalog.ts`.

## D-43 · Shared demo access is an explicit local opt-in (2026-11-15)

`DEMO_MODE=1` enables the MVP endpoints; it does not grant anonymous access to the seeded family. Creating shared access through `POST /api/demo-session` additionally requires `BRAINEE_SHARED_DEMO=1`. Existing valid family sessions are reused without the flag. Keep it unset in production; enable it only for `pnpm demo`, browser fixtures and report recording. Anonymous child entry returns to `/` → `/start`; Start and Jury each create an independent family. No new auth infrastructure.

## D-42 · Remote games on R2 · 2026-11-15 · accepted · extends D-15, D-32, D-38
**Decision:** remote iframe builds use Cloudflare R2 through a small server-only S3 SigV4 driver; filesystem storage under `data/remote-games/` is the local/test equivalent. Built-in games and media stay in the repository. Versions store driver ids and keys, never remote browser URLs, following GSP's build-storage boundary. An immutable `games/<id>/<version>/` tree plus a mutable validated catalog enables publishing, disable and rollback without deploying the app. One operator publishes at a time (catalog updates are not a concurrent multi-writer API).
**Isolation:** browsers load only `/g/<id>/<version>/...` through our Next handler. Both iframe and response CSP enforce `sandbox allow-scripts`; games cannot use app cookies/storage or external network services. Versioned responses are immutable and checked against catalog SHA-256. Disable removes discovery/launch and blocks subsequent scored finishes after the ~60-second catalog cache refresh; already cached static assets cannot be recalled. No payment or analytics service is added.
**Scoring:** server-side lazy sync on remote session start/finish creates/updates `games` rows, preserves built-ins and never inserts unscored previews. Scoring fields are immutable across scored versions of an id so rollback cannot reinterpret an issued result; changed rules require a new id. Core remains the only reward/stat authority. Completed receipts retain their existing replay behavior. Explicit operator publishing with `--target deployed --yes` also syncs only affected game rows after storing the catalog; local publishing uses local SQLite. Dry-run makes no writes or DB connection.
**Costs:** Standard R2's monthly free allowance is 10 GB-month, 1 million Class A operations and 10 million Class B operations; direct R2 egress has no charge. Beyond allowances storage/operations are billed; the own-origin Vercel proxy also consumes Vercel transfer/function limits. Stay within both free tiers. [Cloudflare pricing](https://developers.cloudflare.com/r2/pricing/), [S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/).
**Consequences:** server-only credentials in ignored operator env files locally and Vercel environment settings; no client SDK or `NEXT_PUBLIC_` key. The GSP publisher's public-prefixed manage-games credential is not reused. R2 outages leave built-in discovery/launch usable; remote operations fail closed. Author requirements and verification: [games.md](games.md#remote-games-r2).

## D-41 · The offer shows real prices but takes no payment · 2026-11-15 · accepted · extends D-35, narrows "no checkout"
**Context:** the sales funnel ends on an offer and the team wants the real price points ($14.99 a month, $79.99 a year) and a one-tap start that opens the app. No payment provider, billing backend or third-party analytics exists.
**Decision:** the offer shows the two prices from constants (`MONTHLY`, `ANNUAL` in `funnel-quiz.ts`; `commercialPlans()` is display-only) and a plan choice that is stored on the family (`showcase.startPlan`) for display. It takes no card, PIN, email or password and no money; the CTA calls `POST /api/onboarding/start`, which creates a normal `"demo"` family with generated credentials. The 15-minute Starter Pack timer is stored in the browser and never resets; on expiry the pack is not granted and prices do not change. The Starter Pack is the exclusive `cape` accessory (slot `back`, never sold) plus 100 ★.
**Consequences:** real billing still needs its own decision entry. `families.plan` keeps meaning "demo or jury". The funnel sends no events to any service and everything loads from our own origin. The start endpoint is demo-mode only, like `/api/onboarding`.

## D-40 · Full brain-rot effects are allowed in the parent funnel only · 2026-11-15 · accepted · narrows D-36's "no rot, stink or flies"
**Context:** the sales quiz needs the parent to see the child's brain deteriorate with every answer; that is the marketing device. The child app must stay kid-safe ("Brainy never dies").
**Decision:** `<Brainy effects="full">` (rot spots, stink, flies) is allowed **only inside `/start`**, driven by the funnel health score (= mood, start 80, minus per-answer drains). Every child and parent app surface keeps `effects="kid"`; an e2e test fails if a child route renders `data-effects="full"`. The app starts the saved Brainy at the funnel health as its mood (clamped to `MOOD_FLOOR`), always shown in the kid-safe version.
**Consequences:** copy around the effect stays non-medical and blames the feed, not the parent or the child. Kids never see rankings or the rot look.

---

## D-39 · Ship only content that exists · 2026-11-15 · accepted · narrows D-21/D-29/D-33
**Context:** Leisure showed cartoons with a 12-second illustration player, four science videos with an animated timer player and four fun titles without a game. Only Snake and the three D-33 films have real content.
**Decision:** list only real content. Remove the cartoon cards, `/cartoon/[id]`, `CartoonPlayer`, the `cartoons` showcase field and `buy-cartoon`. Keep science entries only for registered films; `/video/[id]` renders not-found for any other id, and the placeholder `DemoPlayer` is gone. Seed only Snake among fun games. `syncCatalog` now makes saved `science`/`fun` lists match the catalog (adds new items, drops removed ones, keeps progress), so existing families lose the placeholders on their next read.
**Consequences:** fun stars buy Snake time only; a family's progress or ownership of removed placeholder items is discarded. The «video» feed kind and final-quiz rules stay for films. Paid cartoons return only with real own-origin media and a new entry.

## D-38 · Games register from their own folders (generated registry) · 2026-11-15 · accepted · supersedes D-12's "no generated TS registry"
**Context:** build, checks and the catalog each listed game ids by hand (#8). Next (Turbopack), esbuild and Vitest share no glob-import feature, so a runtime-only scan cannot feed the client catalog.
**Decision:** `scripts/discover-games.mjs` derives the game list from each folder's `manifest.json`/`preview.json` and writes gitignored `*.generated.ts` modules (postinstall and every dev/test/typecheck/build/check entry point). Each embedded folder exports `buildGame()` (and optional `checkAssets()`). Manifests require a same-origin `thumbnail`; previews carry declarative `explore` metadata read by `ExplorePlayer`. GSP Phaser games use `engine-phaser` as their shared family adapter.
**Consequences:** adding a game touches only its folder (plus e2e spec regexes). A stale generated file is possible until any listed command runs; a fresh checkout gets it from `pnpm install`.

## D-37 · English-only feature copy · 2026-11-15 · superseded by D-34 (English-only platform)
**Decision:** new features and UI text remain English only in feature-local copy modules. Write English copy for the product instead of translating the design files' placeholder text. D-34 governs the whole platform; the former exception preserving Russian translations and locale controls no longer applies.

## D-36 · Claude Design lavender system and the Brain component · 2026-11-15 · accepted · extends D-35, supersedes D-13 visual identity
**Context:** the owner's Claude Design artifact (frozen copies in git history at `ca3c1d2:docs/ideas/claude-design/`) shows the full lavender child and parent apps and a live Brain mascot. It shares tokens with the funnel export.
**Decision:**
- **Visual source of truth:** [product/design.md](../product/design.md).
- **Tokens:** remap onto the existing names for a fast re-skin. Manrope for UI and titles, Unbounded only for numbers. Lucide icons at 2 px. Gains are blue (`#2847C7` on `#E3E9FF`) and losses peach (`#9A3B12` on `#FDE6D8`), not green/red.
- **Brainy:** becomes a port of `Brain.dc.html`, driven by our data: energy = mood; stage → size, with lightning only at the top stage; body stats → lobes, eyes, smile, limbs, legs. The current API is kept.
- **Kid-safe states:** the child app never shows rot, stink or flies (`effects="kid"`).
- **Child tabs:** Learn · Leisure · Brainy hub · Path · Gifts.
- **Game palette:** `--game-*` / `GAME_PALETTE` in `packages/ui`, shared by the host and React/Phaser games; pinned artifacts keep their art.
- **Not taken:** school, grades, league and TikTok features, kid rankings, Google Fonts.

**Consequences:** plan [plans/redesign.md](../plans/redesign.md) gains T-140–T-142, and T-138 is unblocked. Games adopt the palette inside their folders via issue #4. The "full" brainrot effects stay unused unless the owner records a new decision.

## D-35 · Parent funnel at /start and the lavender design · 2026-11-15 · accepted (defaults; owner may revise) · extends D-24, supersedes D-13 tokens
**Context:** the Brainy Funnel Export (a 25-screen US parent quiz plus the "AppLavender" tokens) replaces the prototype look and the child-habit quiz; see [funnel.md](../product/funnel.md).
**Decision:** port the funnel into the Next app as the parent entry at `/start` (`/onboarding` redirects there), with logic in `packages/core/src/funnel.ts`. Five funnel answers map onto the existing `QuizAnswers`, so `quizStart` and quiz-first signup stay unchanged. Funnel answers are stored as `showcase.familyPlan`, and the plan is computed in core. Lavender tokens keep the current token names; Manrope is vendored; Brainy keeps the parametric renderer in the new pink/violet look. The offer shows "pricing pending": no checkout, no payment provider and no third-party analytics.
**Consequences:** plan in [plans/redesign.md](../plans/redesign.md) (T-130–T-139). Product pages wait for the AppLavender child/parent designs. Billing, real prices and funnel analytics need new entries.

## D-34 · English-only platform · 2026-11-15 · accepted · supersedes the Russian locale of D-22/D-30/D-31
**Context:** the owner decided the whole product is English-only. The RU switch, Russian e2e selectors and Russian in-game copy cost a second set of strings and tests for no audience.
**Decision:** the host serves only `i18n/en.ts`; `ru.ts`, the locale switchers, the `brainee_locale` cookie and the `BRAINEE_DEFAULT_LOCALE` test fallback are removed, as is the RU→EN content map (`i18n/content.ts`). The bridge's `LOCALES` is `["en"]` and the handshake still carries `locale: "en"`. Every game ships English copy only; films are English (`FILM_LANGS = ["en"]`). The Russian source material under `docs/ideas/` was removed from the tree and remains in git history at `b1a3c68`.
**Consequences:** `english.spec.ts` fails on any Cyrillic in host pages, embedded games or previews. Strings saved in Russian by earlier builds (feed titles in old jury families) show as written until those families expire or `pnpm db:refresh-demo` replaces the shared demo. Adding a language later means reintroducing a dictionary type and a switch.

## D-33 · Interactive films are mp3 + a JSON script drawn in the browser · 2026-11-15 · accepted · extends D-21/D-30
**Context:** ElevenLabs podcasts with questions should become interactive cartoons without rendering video, extra services or economy changes. The task instructions assumed a vanilla prototype (`assets/film.js`, `films/`, `tools/*.py`) that doesn't exist in this monorepo.
**Decision:** format and checks are pure functions in `core/film.ts`. Art (`FILM_BG`/`FILM_PROPS`), `FilmStage`, the layout check and the `FILM_IDS` registry live in the new `packages/films`, and `pnpm check:films` replaces `check_film.py`. Media is served from `public/media/films`. A film is a `science` entry with the same id. `/video/[id]` switches to the film player for registered ids, keeps pause-only controls and minute-based position, and ends on the existing final quiz. Brainy gets an optional `talk` mouth driven by Web Audio. `/lab/film` replaces the HTML studio. Transcription is local faster-whisper through uv by default (no key), or ElevenLabs Scribe when `ELEVENLABS_API_KEY` is set.
**Consequences:** the narrator is a replaceable slot (`FilmNarrator`); the app passes the child's own Brainy (stats + equipped accessories), and `packages/films` has no Brainy dependency. In-film questions grant nothing; only the final quiz pays +15★/eyes +2 as before. Films carry `lang` (all three are English); the player chrome follows the app locale (`useI18n`, D-30). Seed changes need `pnpm db:reset` to show up. Details: [films.md](films.md).
**Integration (issue #5):** squash-merged from PR #1 so the original 12 MB mp3 blobs and merge commits stay out of `master` history; the mp3s are re-encoded to 64 kbps mono speech. Captions and in-film questions are English only (D-34). Raw sources in `videos/` are gitignored. `make_film.py` reads `ELEVENLABS_API_KEY` from the environment only; faster-whisper, uv and ElevenLabs are dev-time tools, never needed by `pnpm build` or at runtime.

## D-32 · Pinned path-C artifacts and per-game session adapters · 2026-11-14 · accepted · extends D-16, D-28
**Context:** the 30-game handoff pins external games with different controls, progress stores and completion semantics; a launcher smoke test alone cannot validate Brainee rewards.
**Decision:** keep selected original static files and LICENSE under `games/<id>/artifact/`, with repository commit, original paths, Git blob SHA-1 and SHA-256 in `sources.lock.json`. Check hashes in `pnpm check`; normal builds fetch nothing. A reviewed build transform creates the local served copy and adds the game-specific protocol-2 session adapter. The first adapter is Tangram's guided DOM engine: four completed silhouettes, Check-based mistakes, one correction per previously mistaken silhouette, native select/place and automatic orientation. Remove free/debug/audio/storage paths from served code. Other engines require their own reviewed adapters; do not infer round completion from page loads or generic button clicks.
**Preview boundary:** separate strict `preview.json` entries run in Explore with lifecycle-only bridge handling, same-origin exit validation and no issued learning session. Original English gameplay can remain. Sugarizer reflection and QLOBE memory/rhythm use per-engine session shells; no generic click-to-reward adapter. iPad landscape is the primary review viewport.
**Consequences:** immutable upstream bytes remain auditable separately from our port; generated public output remains ignored. Manifests drive registration and seed without another DB migration. Existing issued-session/finish receipt/economy rules are unchanged. Remaining Wave 1/Wave 2 imports are an explicit queue, not registered placeholders. Worktree verification can use `BRAINEE_NEXT_DIR`, `BRAINEE_E2E_PORT` and a separate SQLite path.

## D-31 · Localized presentation and bounded feedback · 2026-11-14 · accepted · extends D-13/D-30
**Context:** the US-first demo needs reproducible English evidence and calm feedback without changing saved rewards or coupling the SVG package to a web locale.
**Decision:** web callers use a localized Brainy wrapper; the pure SVG defaults to decorative. The install manifest defaults to English. Published walkthroughs use WebKit, `brainee_locale=en` and New York time; Russian remains covered by browser smoke/regression flows. Keep the existing Motion provider: render-only counters, three finite reward stars, two idle breaths and a single stage entrance; reduced motion makes values immediate and removes movement.
**Consequences:** no new dependency, economy rule or service. Loading/error views use the active dictionary. An already loaded app keeps confirmed data and offers recovery when requests fail; there is no offline cache/service worker and no promise of cold-start offline play. Physical Screen Time/Add to Home Screen checks remain the owner's T-62/T-84 rehearsal. Game manifest/host localization stays with the games session (T-112).

## D-30 · US English is the primary locale and demo content · 2026-11-14 · accepted · supersedes D-22 language order
**Context:** the US is the main future audience; T-104 made English the default UI, but seeds, names and report captures still assumed Russian/Kazakhstan.
**Decision:** English is the default locale (`brainee_locale` cookie, Russian by switch). The shared demo and jury seeds are US English (child "Mia", jury child "Ava", login `mom@example.com`, US names, en-US numbers, America/New_York). The Russian UI translates seeded strings and current game titles at display time through `[en, ru]` pairs in `apps/web/src/i18n/content.ts`; parent-typed text is shown as written. `pnpm db:refresh-demo` replaces only the shared demo family, so the cloud DB can be updated without wiping jury families. Report captures use `brainee_locale` and New York time.
**Consequences:** new seed strings need a pair in `content.ts` for the RU switch. Game manifests (games worktree) still carry Russian titles, mapped in the web layer until they move to English keys. E2E keeps Russian selectors through the server-only fallback `BRAINEE_DEFAULT_LOCALE=ru` (a Playwright `cookie` header replaced the session cookie jar and broke API calls); recordings set the `brainee_locale` cookie. English recordings/specs are a follow-up.

## D-29 · Jury access and a live presentation loop · 2026-11-14 · accepted · extends D-21/D-24/D-25
**Context:** a visitor should try child and parent roles without setup, while real families keep quiz-first onboarding.
**Decision:** demo-only `POST /api/jury` creates an isolated `jury` family, generated scrypt credentials, nine real completed sessions and an elevated device cookie; creation deletes jury families older than seven days. Credentials are returned once and retained in this tab's session storage. `/signup` uses neutral quiz answers; both signup paths end at pairing/Screen Time setup. Add only `game_sessions.recommended`; session history drives recommendations and live analytics. Radar history, character radar and ranking remain explicitly illustrative.
**Consequences:** no new service or table. Core owns app-task auto-completion and earned rewards; thresholds/progress are defined once in `EARNED_THRESHOLDS` (see [mechanics](../product/mechanics.md#accessories)). Jury history is one game short of the badge; the shared demo retains its valid backpack/badge and is one learning day short of the garden. Unlocks persist and produce a child celebration plus parent event. Content reset requires parent elevation and preserves progress.

**Leisure:** Snake is a React component reporting `GameResult` to its leisure host, with pure movement rules in core and no learning rewards. Keep it outside the separately owned learning-game registry for this presentation slice. Purchased ten-minute credits accumulate in showcase JSON; active foreground play reports bounded, sequenced heartbeats, capped by server elapsed time. Pause/hide flushes elapsed seconds; idle time costs nothing. Refresh resumes saved credit, and forever ownership bypasses debit. Abrupt termination can lose at most one heartbeat of usage; this demo timer is not an anti-cheat boundary. Bought cartoons use an explicit-play placeholder, always starting at zero, without autoplay or next-content suggestions.

## D-28 · Port the bounded bridge and manifest-backed game runtimes · 2026-11-14 · accepted · implements D-16
**Context:** Picture Puzzle needs a same-origin Phaser runtime that preserves issued sessions, server-only rewards and per-game skill weights.
**Decision:** port GSP `bridge-core` and `phaser-core` at reference commit `13f8eff`, removing PECS/speech/remote host methods. Protocol 2 accepts 1, with MessageChannel + nonce, zod event validation, bounded event deduplication, message size/rate limits and a 10-second host ready timeout. Add only `games.runtime` (default `react`) and nullable `games.runtime_url`; manifests seed these alongside weights/minAge/rounds. Keep the existing session API and LearningProvider finish path. Picture Puzzle counts four placements, with one correction per placed piece that had rejections, holding the issued level through picture changes. Build artifacts and all assets stay on our origin.
**Consequences:** no service, reward logic or family-timezone dependency is added. Manifest validation and all-game browser conformance cover the three listed games. `GameVersion`, automatic artifact imports and the GDevelop export kit remain deferred. Detailed runtime rules: [games.md](games.md#implemented-platform-slice-t-29--t-85--t-89--t-90).

## D-27 · Parent settings and paired devices · 2026-11-14 · accepted · supersedes D-26 timezone default
**Context:** families need editable child details, a chosen calendar zone and revocable child devices without another service.
**Decision:** default new families and demo data to `America/New_York`; signup uses the browser zone only when it belongs to the eleven-zone allowlist in `core/settings.ts`. Settings changes take effect immediately through core calendar rules, preserving an already claimed daily bonus. Child promise stays in showcase JSON. PIN changes verify the old scrypt hash and revoke other device elevations. The server checks 15-minute parent access for every settings mutation; the adult arithmetic fallback grants the same elevation.
**Consequences:** add `demo_sessions.revoked` plus `pairing_codes` (hashed six-digit code, child, expiry) and `pairing_attempts` (hashed attempt key, failures, lock expiry). A code expires after 15 minutes, is consumed transactionally once, and replacement invalidates the previous code. Five failures lock attempts for 10 minutes. Local requests share a server-side attempt bucket; a future deployment must supply a trusted address for separate buckets. Revoked cookies return to login, including after reload. No provider, payment or export. Onboarding keeps `quizStart` and adds only timezone to signup; the optional referral field has no reward or attribution backend yet.

## D-26 · Persist calendar rollover in the showcase · 2026-11-14 · default superseded by D-27 · extends D-25
**Context:** ROUTES.md requires family-local daily/weekly resets and a daily bonus that cannot be reclaimed by opening another device.
**Decision:** keep calendar keys, IANA timezone and the child's shared bonus flag in the existing showcase JSON. Use `Asia/Almaty` as the MVP default until Settings exposes timezone selection. Core computes rollover; state reads and relevant mutations persist it transactionally and bump the family version. Cookie streak counters reset together at midnight; completion receipts remain immutable. Retain the latest 100 archived tasks in the showcase and show them read-only to parents.
**Consequences:** no cron, new service or schema migration. Undated demo/legacy data is dated on first use without erasing it; an existing paid session flag is retained conservatively. New families are dated at signup. Demo content reset clears task history but preserves calendar/bonus; use a full DB reset for a new bonus rehearsal. Mechanics: [calendar resets](../product/mechanics.md#calendar-resets).

## D-25 · ROUTES.md is the product spec, reduced for our stack · 2026-11-14 · accepted · extends D-15, D-16, D-21
**Context:** new inputs in `docs/ideas/` (now in git history at `b1a3c68`): `ROUTES.md` + `brainy-mvp.zip` (routes, roles, rules, events, clickable prototype) and a 30-game handoff for external learning games. Summary: [routes-spec.md](../product/routes-spec.md), [external-games.md](../product/external-games.md).
**Decision:** adopt ROUTES.md behaviour with reductions: polling stays (no SSE, no Web Push; "Needs attention", badges and an event feed instead); our current paths stay (mapping in routes-spec); events live as a capped feed in the showcase; mood decay and resets are computed on read (no cron); the prototype's Google Fonts/cdnjs are never copied. External games: all source licences are permissive (QLOBE-kids MIT, Sugarizer Apache-2.0, H5P MIT, h5p-standalone MIT, Blockly Games Apache-2.0); they come in as path C artifacts after T-29, starting with Tangram Tales. Ranking stays fake/seeded; privacy work and the science-video media question wait.
**Consequences:** product work follows routes-spec; the 30-game pack is a later catalog source, not an MVP blocker.

## D-24 · Onboarding quiz before the account; own minimal accounts · 2026-11-14 · accepted · extends D-21
**Context:** the PRD/prototype put a habit quiz in onboarding; the product owner wants it **before** the account exists, initialising Brainy.
**Decision:** `/onboarding`: 5 questions (0–3 each) → `quizStart` in `core` (prototype formula, body stats capped at 40) shows the starting Brainy → signup (child name, birth year for age 4–10, email, password, PIN) → `POST /api/onboarding` creates family, parent (scrypt password + PIN), child, wallet (50 ★), Brainy (quiz stats and skills, `startSnapshot` = baseline) and a personalised showcase, then sets the device cookie with parent mode unlocked. `POST /api/auth/login` (email + password) opens the family's child on this device. Parent unlock is 15 min; "Back to Child" locks and returns to `/entry`. Demo account: `mama@example.com` / `demo1234`, PIN 1234. No auth provider.
**Consequences:** works only with `DEMO_MODE=1` like the other APIs; password reset, device pairing codes and multi-child families are follow-ups. A methodologist replaces the quiz formula later.

## D-23 · Per-game skill weights drive real stat changes · 2026-11-14 · accepted · supersedes the fixed prototype gains
**Context:** each game trains several abilities in different proportions; finishing a game must change the child's metrics accordingly.
**Decision:** every learning game has `weights` (ability → share, sum 1) and a `minAge`, stored on the `games` row and mirrored in game metadata. Children have six ability scores (`brainy_states.skills`). A completed session earns a budget `(3 + (level − 1)) × (0.5 + 0.5 × first-try accuracy)`, split by weights into whole-point ability gains (`weightedSkillGains`); abilities update, and body parts grow by the summed gains of their abilities (logic/memory → brain, attention → eyes, speech/reading → mouth, motor → arms). Parent radar "now" and recommendations read the live scores. Science-video eyes gains also train attention.
**Consequences:** Odd one out (attention 1.0) keeps +3 eyes at level 1; Continue the pattern (logic 0.7, attention 0.3) gives logic +2/attention +1. Calibration remains a methodologist's choice in one place (`stat-gains.ts`).

## D-22 · Russian now, English later; catalog for ages 4–10 · 2026-11-14 · language order superseded by D-30
**Context:** the 30-game handoff assumes US English for ages 6–9; the PRD is Russian with younger children.
**Decision:** the product stays Russian for now; an English locale (`en.ts`) comes later. The catalog spans ages 4–10; each game has a recommended minimum age, games above the child's age show locked "Unlocks at age N", and recommendations only offer open games.
**Consequences:** English-only external games wait for the locale or must be language-light.

## D-21 · Seeded showcase content for the presentation MVP · 2026-11-14 · accepted · extends D-20
**Context:** the MVP must show every page and its basic interactions for the pitch; calculating analytics, tasks history and media catalogs properly is out of scope for the hackathon.
**Decision:** one `showcases` row per child holds seeded JSON (analytics, tasks, recommendations, gifts/requests, leisure catalog, science videos, accessories owned/worn, entry log). It is part of the versioned `/api/state` snapshot. `POST /api/actions` validates each interaction with the pure `applyShowcaseAction` in `core` (economy/accessory rules reused) and saves showcase, wallet and stat gains in one transaction with a version bump, so child and parent devices converge by polling. Parent actions need a device PIN unlock (`demo_sessions.parent_until`, scrypt-verified, 30 min) via `POST/DELETE /api/parent`. `POST /api/demo-reset` (DEMO_MODE only) restores the seed for tests and presentations. Charts are hand-rolled SVG (no Recharts dependency). Navigation uses React `<ViewTransition>` cross-fade/slide with reduced-motion off.
**Consequences:** analytics numbers are illustrative and labelled "Demo data"; they don't change with play except live Brainy/wallet/latest game/goal. Real computation, proper Task/Gift tables and media remain T-41–T-46/T-50 follow-ups. The child snapshot also carries parent-facing demo data, acceptable only in demo mode (T-82). Fun games and cartoons can be bought but not played (no content yet).

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

## D-12 · Port the game platform from `game-store-planning` · 2026-11-14 · accepted (registry clause superseded by D-38) · refines D-11, supersedes the game-lab app (D-08)
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
