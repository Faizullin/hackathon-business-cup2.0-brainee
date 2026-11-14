# Demo sessions and saved learning results

Implemented: the T-50/T-51 connected-demo subset, T-52's cookie session, T-54 and the session part of T-81. The child UI still uses the [temporary preview](ui.md#temporary-learning-preview-t-35); connecting it to these endpoints and polling state is T-55. The parent PIN barrier is T-40, not a privilege granted by this cookie.

## Access

Opt in with `DEMO_MODE=1` after preparing the database ([setup](setup.md#local-database-and-tests)). Without it, every endpoint below returns 404 before opening a database. This is public access to one seeded demo child, not production authentication. No client-supplied child/family ID selects an identity.

`POST /api/demo-session` creates a random 256-bit opaque cookie, `brainee_demo`: HttpOnly, SameSite=Lax, path `/`, Secure on HTTPS, expiring after seven days. Only its SHA-256 hash is stored. An existing valid cookie is reused, preserving its run/bonus state. Expired or malformed cookies cannot authorize writes. Responses expose no token, parent email or PIN hash. Connections are opened and closed per request; nothing depends on shared process memory.

All responses use `Cache-Control: no-store`. POSTs require an Origin matching the HTTP host and protocol (including the port). Start/finish bodies require JSON and are limited to 4 KiB, including streamed bodies without Content-Length. Errors contain an English machine code; future UI messages belong in `i18n/ru.ts`.

## Endpoints

| Method / path | Request | Success |
|---|---|---|
| `POST /api/demo-session` | no body | 201 with child `{ id, name }` and `expiresAt`, cookie set; 200 if already authorized |
| `GET /api/demo-session` | cookie | 200 with child `{ id, name }` and `expiresAt` |
| `POST /api/sessions/start` | cookie + `{ gameId, level, seed? }` | 201 with `{ sessionId, gameId, level, seed, startedAt, expiresAt }` |
| `POST /api/sessions` | cookie + `{ sessionId, result: GameResult }` | 200 with `{ replayed, completion: LearningCompletion }` |
| `POST /api/sessions/stop` | cookie, no body | 200 `{ stopped: true }` |

Errors: 400 invalid JSON/contract/result; 401 missing/expired access; 403 missing/foreign Origin; 404 unknown or another cookie's issued game; 409 conflicting replay or abandoned game; 410 expired pending game; 413 oversized body; 415 non-JSON body; 503 unavailable database. An unprepared database is never silently seeded by a request.

## Start, finish, retry, stop

1. Start accepts only an enabled learning game from the database catalog, an integer level in its range, and an optional unsigned 32-bit seed (zero is valid). Otherwise the server generates the seed. The returned UUID identifies a pending game owned by this cookie and child, valid for one hour. Use that ID for every finish retry; do not start a replacement game to retry a finish.
2. `parseLearningGameResult` in core checks the exact GameResult fields, catalog game/level/round count, nonnegative safe integer counters, corrections ≤ rounds/mistakes and consistent mistake/correction counts. Rewards, identities, balances and stat deltas are forbidden inputs. The store additionally matches the issued game/level, status and deadline. Client duration may not exceed server elapsed time by more than five seconds. These checks validate reported results; they do not prove human play (T-82).
3. A write transaction reads the latest Brainy/wallet/run, calls core's `finishLearningSession`, then saves the wallet, Brainy/mood, cookie's run, immutable completion receipt and family version together. Each accepted finish increments `Family.version` once. Prototype stat calibration remains [as specified](../product/data-model.md#how-stats-change). Stage is derived by core, not a redundant database column.
4. An identical retry returns the original saved completion with `replayed: true`, even after the launch deadline, while its access cookie remains valid. It makes no writes. JSON key order does not matter. A different valid result for that ID returns 409. A receipt describes that finish's historical before/after; T-55 must refetch current state rather than overwrite a newer wallet with a replayed receipt.
5. Stop resets the run using core and abandons every pending game for this cookie. Completed receipts stay replayable. The one-time bonus flag survives stopping. The saved run belongs to the cookie (shared by its tabs), distinct from the current per-tab UI preview. A new demo cookie starts a new run/bonus flag without resetting the child's saved wallet or Brainy.

No arbitrary replay can award twice for the same issued ID. Atomicity, simultaneous finishes on independent connections, rollback after the last write fails, foreign-cookie access, expiry, correction rewards and stop/bonus behavior have database tests. Playwright covers the HTTP contract and real browser fetch/cookie behavior. Its database is a fresh temporary file, seeded before server startup and removed afterward; it never resets the developer's database.

## Remaining boundaries

T-55 adds a versioned snapshot endpoint and polling, then replaces client preview writes. Parent analytics remain behind T-40's barrier. T-50/T-51 still include other entities and scenario switching; T-81's task updates await T-44. Demo/production sessions, cleanup/retention, backups and stronger play evidence remain T-82. Local driver/tool compatibility is recorded in [D-19](decisions.md); no deployment work is included.
