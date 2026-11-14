# Demo sessions and saved learning results

Implemented: the T-50/T-51 connected-demo subset, T-52's cookie session, T-54, T-81's session validation and T-55's shared-state/child UI integration. Parent actions require the separate PIN unlock (D-21/D-24); the child cookie alone grants no parent privilege.

## Access

Opt in with `DEMO_MODE=1` after preparing the database ([setup](setup.md#local-database-and-tests)). Without it, every endpoint below returns 404 before opening a database. This is public access to one seeded demo child, not production authentication. No client-supplied child/family ID selects an identity.

`POST /api/demo-session` creates a random 256-bit opaque cookie, `brainee_demo`: HttpOnly, SameSite=Lax, path `/`, Secure on HTTPS, expiring after seven days. Only its SHA-256 hash is stored. An existing valid cookie is reused, preserving its device run; the daily bonus belongs to the child. Expired or malformed cookies cannot authorize writes. Responses expose no token, parent email or PIN hash. Connections are opened and closed per request; nothing depends on shared process memory.

All responses use `Cache-Control: no-store`. POSTs require an Origin matching the HTTP host and protocol (including the port). Start/finish bodies require JSON and are limited to 4 KiB, including streamed bodies without Content-Length. Errors contain an English machine code; future UI messages belong in `i18n/en.ts`.

## Endpoints

| Method / path | Request | Success |
|---|---|---|
| `POST /api/demo-session` | no body | 201 with child `{ id, name }` and `expiresAt`, cookie set; 200 if already authorized |
| `GET /api/demo-session` | cookie | 200 with child `{ id, name }` and `expiresAt` |
| `GET /api/state?since=N` | cookie; optional nonnegative safe-integer version | 200 `{ changed: false, version }` if unchanged, otherwise `{ changed: true, snapshot: StateSnapshot }` |
| `POST /api/sessions/start` | cookie + `{ gameId, level, seed? }` | 201 with `{ sessionId, gameId, level, seed, startedAt, expiresAt }` |
| `POST /api/sessions` | cookie + `{ sessionId, result: GameResult }` | 200 with `{ replayed, completion: LearningCompletion }` |
| `POST /api/sessions/stop` | cookie, no body | 200 `{ stopped: true }` |

Errors: 400 invalid JSON/contract/result; 401 missing/expired access; 403 missing/foreign Origin; 404 unknown or another cookie's issued game; 409 conflicting replay or abandoned game; 410 expired pending game; 413 oversized body; 415 non-JSON body; 503 unavailable database. An unprepared database is never silently seeded by a request.

## Start, finish, retry, stop

1. Start accepts only an enabled learning game from the database catalog, an integer level in its range, and an optional unsigned 32-bit seed (zero is valid). Otherwise the server generates the seed. The returned UUID identifies a pending game owned by this cookie and child, valid for one hour. Use that ID for every finish retry; do not start a replacement game to retry a finish.
2. `parseLearningGameResult` in core checks the exact GameResult fields, catalog game/level/round count, nonnegative safe integer counters, corrections ≤ rounds/mistakes and consistent mistake/correction counts. Rewards, identities, balances and stat deltas are forbidden inputs. The store additionally matches the issued game/level, status and deadline. Client duration may not exceed server elapsed time by more than five seconds. These checks validate reported results; they do not prove human play (T-82).
3. A write transaction reads the latest Brainy/wallet/run, calls core's `finishLearningSession`, then saves the wallet, Brainy/mood, cookie's run, child's daily bonus flag, immutable completion receipt and family version together. Each accepted finish increments `Family.version`; a calendar rollover also increments it. Prototype stat calibration remains [as specified](../product/data-model.md#how-stats-change). Stage is derived by core, not a redundant database column.
4. An identical retry returns the original saved completion with `replayed: true`, even after the launch deadline, while its access cookie remains valid. It makes no writes. JSON key order does not matter. A different valid result for that ID returns 409. A receipt describes that finish's historical before/after; the client refetches current state rather than overwriting a newer wallet with a replayed receipt.
5. Stop resets the run using core, abandons pending games for this cookie and increments the family version so other tabs observe the changed run. Completed receipts stay replayable. The daily bonus flag survives stopping. Run counters are cookie-scoped (shared by its tabs); the paid flag is child-scoped in the showcase calendar. A new cookie starts a new run but cannot earn the same daily bonus again. Calendar boundaries follow [the reset rules](../product/mechanics.md#calendar-resets).

No arbitrary replay can award twice for the same issued ID. Atomicity, simultaneous finishes on independent connections, rollback after the last write fails, foreign-cookie access, expiry, correction rewards and stop/bonus behavior have database tests. Playwright covers the HTTP contract and real browser fetch/cookie behavior. Its database is a fresh temporary file, seeded before server startup and removed afterward; it never resets the developer's database.

## Shared state and client recovery (T-55)

`getStateSnapshot` first applies any calendar rollover, then reads version, child identity, Brainy/mood, wallet, this cookie's run, shared daily bonus, quiz baseline and latest completed game in the same transaction. A rollover bumps the version, so polling with the previous `since` returns the new day/week. The response type lives in core; it contains no parent credentials or cookie hashes. Its correlated history lookup is child-scoped. Missing/expired access returns 401; malformed `since` returns 400. Matching versions omit the snapshot body. Stats, wallet and version therefore cannot come from different database read moments.

The child provider bootstraps the demo cookie once, then polls every three seconds via TanStack Query. It sends the cached version, consumes cancellation signals, preserves unchanged data and rejects delayed snapshots older than its cache. Refresh after a mutation cancels older reads first. Balances/stats/mood are never calculated or restored from browser storage. Initial and background failures have separate recovery states. Expired access asks for an explicit reload instead of silently replacing the cookie during an issued game. The current-state query is inactive on public/lab routes.

Before sending a finish, the host retains `{ issued, result }` under `brainee-pending-finish-v1` in per-tab sessionStorage. If storage is blocked, memory still permits an explicit retry while the page remains open. No optimistic wallet/stat grant occurs. A lost response or failed state refresh retains the same ID/result. Retry (including reload recovery) submits that same ID, then refetches current state. Completion appears and the pending item is removed only after both succeed. A historical replay cannot lower the current displayed balance.

Unresolved results redirect new game requests back to their original game; the Learn/Brainy shell also offers a recovery link. Permanent finish errors (invalid, abandoned, expired or unauthorized) offer a fresh start without awarding locally. In-progress games without a finished result are not resumed. The retired T-35 preview key is ignored/removed, not migrated. This is finite result recovery, not a general offline mutation queue; full offline behavior/retention remain T-84/T-82.

Most browser tests write the same seeded child, so Playwright uses one worker and assertions relative to saved state/caps. Bonus-award tests create isolated families: a new device cookie must not reset a child's bonus. Other-device polling, reload/replay after a lost response, newer balances, blocked storage, refresh failure and keyboard recovery have dedicated specs. The full suite passes with normal pointer input in Chromium and WebKit at phone/iPad widths; the previous local T-93 failure did not recur ([diagnostic history](setup.md#webkit-pointer-diagnostics-t-93)).

## Remaining boundaries

The child cookie alone must not authorize parent actions. T-50/T-51 still include other entities and scenario switching; saved task actions currently use the showcase (D-21). Demo/production sessions, cleanup/retention, backups and stronger play evidence remain T-82. Local driver/tool compatibility is recorded in [D-19](decisions.md); no deployment work is included.
