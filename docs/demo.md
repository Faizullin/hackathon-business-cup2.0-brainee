# Two-device presentation (T-71)

Use an iPad in landscape (1180 × 820 reference) as the child and a phone as the parent. Both must use the same server; separate browsers retain independent cookies. Budget 5–7 minutes. Analytics are illustrative and labelled «Демо-данные».

## Prepare and reset

For a local rehearsal, `pnpm demo` resets the demo database and starts the app with demo access enabled. Parent PIN: `1234`.

For two physical devices on the same Wi-Fi, build first (`pnpm build`), prepare the database, then run `DEMO_MODE=1 BRAINEE_LAB=1 pnpm --filter @brainee/web exec next start --hostname 0.0.0.0`. Open `http://<Mac-LAN-IP>:3000` on both devices. Keep this process running during the presentation. This is local rehearsal, not deployment.

To reset an already running demo, open its browser console and run these same-origin requests:

```js
await fetch('/api/demo-session', { method: 'POST' });
await fetch('/api/demo-reset', { method: 'POST' });
```

Reload both devices after resetting, then start below. The HTTP reset restores showcase content (tasks, gifts, videos and accessories) but preserves balances, Brainy and game history. Use `pnpm demo` or `pnpm db:reset` before a presentation that needs the complete initial state. Never reset mid-walkthrough. An unavailable Brainy screen usually means demo mode is missing; check the server environment and prepared DB.

## Walkthrough

| Step | Child iPad | Parent phone | Expected evidence |
|---|---|---|---|
| 1 | Open `/`, choose a recommended game or the other-games link | Open `/analytics`, enter PIN 1234 | Entry requires a choice; parent analytics show the demo label |
| 2 | Play «Найди лишний» to completion | Leave analytics visible | Before/after Brainy, earned ★ and two next steps; parent's balance/latest game update within about 3 seconds without reloading |
| 3 | Tap «Хватит на сегодня», then Gifts; mark «Прочитать книжку перед сном» done | Open Tasks | Child waits for confirmation; task appears for the parent |
| 4 | Keep Gifts visible | Tap «Подтвердить» on that task | Child receives ☀, weekly progress and responsibility increase without reload |
| 5 | Buy «Мороженое» using ☀ | Open Gifts & goal; mark the request «Вручено» | Balance decreases once and the request is fulfilled |
| 6 | Open Brainy; buy the 50★ accessory, remove and wear it again; return to Learn | Return to Analytics and observe Brainy | Worn accessory follows the mascot; one item occupies each slot |
| 7 (optional) | Start a fresh run and finish three games consecutively | Keep analytics visible | Break suggestion on the third consecutive completion; bonus is awarded only once per cookie |

For a short science demonstration, open Leisure → «Как живут пчёлы», play briefly, pause, close, and reopen: position resumes. The animated placeholder uses one second per demo minute. Complete the quiz to earn ★; a wrong answer pays nothing. Fun games and cartoons currently demonstrate purchasing only: describe their catalog as in development.

## Rehearsal checklist

- Both devices reach the same LAN address, with no horizontal overflow.
- Polling is observed while both pages remain foregrounded; allow up to 10 seconds during rehearsal.
- Verify touch, Safari and Add to Home Screen on the physical iPad (T-62/T-84). Browser emulation does not establish Screen Time allowlist compatibility; that check remains after the final deployment.
- Use [MVP](reports/mvp.md) and [learning](reports/learning.md) recordings as backup. Their actions are automated on a fresh local database.
- If saving fails, use the retry action with the retained result. Do not replay the whole game to recover a pending finish.

## Acceptance walk (T-70)

| Product criterion | Evidence / presentation boundary |
|---|---|
| Entry and logged choice | `mvp-pages.spec.ts`; two playable games are available, so the requested three distinct recommendations remain a catalog limitation |
| Post-game choices, stop and third-game bonus | `post-game.spec.ts`, `pattern.spec.ts`; server receipt and replay checks in `sessions-api.spec.ts` |
| Saved growth and shared state | `state-sync.spec.ts`, core stage tests; parent uses the same polled snapshot, and task confirmation is checked across separate browser contexts |
| Accessories in every child context | `mvp-pages.spec.ts` buys/removes/wears and checks dock plus both post-game portraits; core enforces one item per slot |
| Video pause, resume and quiz | `mvp-pages.spec.ts` verifies saved position, no seek control, no payment before answering; core tests reject repeat rewards |
| Tasks, weekly goal and responsibility | Two-browser UI confirmation plus persisted wallet/goal/resp assertions; core rejects duplicate confirmation |
| Gift currency and one-way exchange | Core showcase/economy tests; saved exchange UI check; gift requests appear in the MVP recording |
| Five-task limit | Core showcase test enforces the boundary; parent form reflects the limit |
| Child has no rankings | Route loop in `mvp-pages.spec.ts`, including after PIN access; parent seeded ranking uses initials |
| Own-domain resources | `own-origin.spec.ts` covers all page routes, both games, all four videos, lab and install assets; physical Screen Time verification remains T-62 |

Visual review covers phone and landscape iPad layouts, readable labels, overflow, native controls and the existing reduced-motion checks. This is presentation acceptance, with the catalog, placeholder-media and physical-device boundaries above; it is not a production accessibility or privacy certification.
