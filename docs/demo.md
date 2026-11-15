# Jury and two-device presentation (T-71 / T-107)

## Prepare
Run `pnpm demo`: reset the local DB and start with demo access enabled. Use a fresh DB before the presentation. This is a local rehearsal, not deployment. An unavailable Brainy screen usually means `DEMO_MODE` is missing.

## Jury path: under one minute
1. Open `/start` (or `/login`) and tap **Jury entry**; it sits in the funnel header on every screen, mid-quiz too. No form or PIN is needed. Each tap creates an isolated family; other visitors keep their own state.
2. `/jury` shows reusable login/password/PIN and two role cards. Choose the child, then finish “Odd One Out”. The family starts at 9/10 completed learning games: the tenth earns the explorer badge, celebrates and completes the 15★ in-app task. The parent feed records both events.
3. Open Path to see the discovery and stage journey. Return to `/jury` and choose the parent. Analytics show real saved minutes, streak and advice counts beside labelled illustrative radars/ranking. Confirm the waiting real-life task or deliver the waiting gift to try the parent loop.
4. Settings → “Reset demo” restores showcase content while preserving balances, Brainy, history and earned rewards. For a fresh badge demonstration, open `/` and create another jury family.

Parent access lasts 15 minutes; use the PIN shown on `/jury` to unlock it again. Credentials remain visible in the creating tab; save them before closing it. Jury families older than seven days are removed when another jury family is created. Demo history is seeded deliberately, then new actions are real and isolated.

## Two-device path: 5–7 minutes
Use an iPad in landscape (1180 × 820 reference) as the child and a phone as the parent. Both must reach the same server. For physical devices on the same Wi-Fi, build (`pnpm build`), prepare the DB, then run `DEMO_MODE=1 BRAINEE_LAB=1 pnpm --filter @brainee/web exec next start --hostname 0.0.0.0`. Open `http://<Mac-LAN-IP>:3000` on both devices. Keep this local process running during rehearsal.

On the parent phone create a jury family, open Settings and generate a child pairing code. On the iPad choose the child-device role and enter that code. These devices now share one family with independent revocable cookies. A new demo family can instead complete the `/start` funnel: its last button creates the family with no forms and opens `/entry`. Settings → “Your login” then shows the generated login, password and PIN 1234 for a second device (they live in that tab's session storage). `/onboarding` redirects to `/start`; the legacy `/signup` form still needs a completed funnel.

| Step | Child iPad | Parent phone | Expected evidence |
|---|---|---|---|
| 1 | Open `/entry`, choose the recommended odd-one-out game | Leave Analytics visible | Child choice is logged |
| 2 | Finish the game, then view Path | Observe Analytics | Brainy/★ update, badge celebration, app task done; parent feed updates through polling |
| 3 | Stop for today, open Gifts | Open Tasks; confirm the waiting real-life task | Child gains ☀ and responsibility; backpack unlocks when responsibility reaches 70 |
| 4 | Keep Gifts visible | Open Gifts and deliver the waiting request | Fulfilment appears on the child device |
| 5 | Open Brainy; buy and wear an accessory | Observe Brainy | The worn item follows the mascot |
| 6 | Buy Snake time in Leisure; play, pause and reopen | Observe saved balance | Purchased minutes count only during play; another purchase adds time |

Science playback resumes position and pays ★ only after the final correct answer. Registered interactive films use local podcast audio, drawn scenes and pauses for questions; those in-film questions award nothing. Playback requires Play, with no next-film prompt. Leisure lists only real content: Snake and the three films; placeholder cartoons, science videos without media and unplayable fun titles are removed (D-39). See [films.md](dev/films.md) for the film catalog and content review. For the shared seeded family, login is `mom@example.com` / `demo1234`, PIN `1234`; its existing backpack/badge are valid, and a game today completes the garden streak.

## Lavender and parent-plan walkthrough

Prioritize the landscape iPad composition, then check the 390 × 844 phone view. The shared navigation is Learn · Leisure · Brainy · Path · Gifts. Learn has the name/date/streak greeting and a compact dark Energy card beside its game grid on iPad. Leisure, Gifts and Explore use that same summary. Brainy keeps the full hero, training action, skill cards and accessory shop; Path owns weekly bars, stages and discoveries. Show the game board centered within its host and the two-column saved-result/break screen.

**First-run path.** `/` opens the funnel on a device with no family and `/entry` on a device that has one. `/start?reset=1` clears the quiz and the Starter Pack timer so you can show it again on the same device; `/start?tour=1` runs a review pass in session storage. Answer the habit questions (a 2–4 h / Shorts / switching / “just one more” / rarely path drops the brain meter to 24 with full rot), name the child, pick an age (Other shows the exit screen), and watch the result, the stages and the offer ($79.99 a year preselected, a 15-minute honest Starter Pack timer). **Start {name}'s plan** creates the family and opens the app, where the “Starter Pack unlocked” moment plays once: Hero Cape worn, +100 ★ (150 total). There is no payment of any kind (D-41). See [funnel.md](product/funnel.md).

For a family created this way, Analytics shows the editable Family plan with its phrase, four steps, observation prompt and plain-text copy/download; Tasks offers an off-screen reading suggestion; the same phrase appears at the child's stopping point. A seeded jury family does not acquire a plan automatically.

The whole product is English only, including games, films and the funnel. Review final screenshots and recording results in the generated reports rather than treating this walkthrough as a verification result.

## Rehearsal checklist

- Both devices reach the same LAN address, with no horizontal overflow.
- Polling is observed while both pages remain foregrounded; allow up to 10 seconds during rehearsal.
- Verify touch, Safari and Add to Home Screen on the physical iPad (T-62/T-84). Browser emulation does not establish Screen Time allowlist compatibility; that check remains after the final deployment.
- Use [MVP](reports/mvp.md) and [learning](reports/learning.md) recordings as backup. Their actions are automated on a fresh local database.
- If saving fails, use the retry action with the retained result. Do not replay the whole game to recover a pending finish.

## Acceptance walk (T-70)

| Product criterion | Evidence / presentation boundary |
|---|---|
| Entry and logged choice | `mvp-pages.spec.ts`; three learning games are available; recommendations use completed sessions from the last seven days |
| Post-game choices, stop and third-game bonus | `post-game.spec.ts`, `pattern.spec.ts`; server receipt and replay checks in `sessions-api.spec.ts` |
| Saved growth and shared state | `state-sync.spec.ts`, core stage tests; parent uses the same polled snapshot, and task confirmation is checked across separate browser contexts |
| Accessories in every child context | `mvp-pages.spec.ts` buys/removes/wears and checks the compact summary plus both post-game portraits; core enforces one item per slot |
| Video pause, resume and quiz | `mvp-pages.spec.ts` verifies saved position, no seek control, no payment before answering; core tests reject repeat rewards |
| Tasks, weekly goal and responsibility | Two-browser UI confirmation plus persisted wallet/goal/resp assertions; core rejects duplicate confirmation |
| Gift currency and one-way exchange | Core showcase/economy tests; saved exchange UI check; gift requests appear in the MVP recording |
| Five-task limit | Core showcase test enforces the boundary; parent form reflects the limit |
| Child has no rankings | Route loop in `mvp-pages.spec.ts`, including after PIN access; parent seeded ranking uses initials |
| Own-domain resources | `own-origin.spec.ts` covers all page routes, both games, all four videos, lab and install assets; physical Screen Time verification remains T-62 |

Visual review covers phone and landscape iPad layouts, readable labels, overflow, native controls and the existing reduced-motion checks. This is presentation acceptance, with the catalog and physical-device boundaries above; it is not a production accessibility or privacy certification.

## Physical iPad rehearsal (T-62 / T-84 — owner checklist)
Use **https://brainee.vercel.app** on an iPad in landscape as the child and a phone as the parent. Use the same canonical domain on both devices; cookies on the alternate deployment hostname are separate.

- [ ] Before the pitch, create a fresh jury family on the phone. Save its generated login/PIN. A new jury family is the cleanest live badge rehearsal; Settings → Reset demo restores content but preserves progress and earned rewards.
- [ ] Try the one-tap jury path, then pair the iPad using the phone's Settings code. Confirm that both devices show the same child and balance.
- [ ] In iPad Screen Time, set Web Content to **Allowed Websites Only** and allow only `brainee.vercel.app`. Test entry, a full learning game, purchases, pairing and parent access. Verify no fonts, images or games need another domain. Record the iPadOS version and any blocked request; automated own-origin checks do not establish physical allowlist compatibility.
- [ ] Safari → Share → Add to Home Screen. Open the installed app, check icons, safe areas, keyboard, rotation and landscape navigation. Confirm language and device access survive reopening.
- [ ] Keep both devices foregrounded. Finish a game on the iPad, then confirm a real-life task on the phone. Time each update: polling is approximately 3 seconds; allow up to 10 seconds in rehearsal and investigate longer delays. Background tabs refresh on return.
- [ ] With Learn already loaded, enable airplane mode. Expect the last confirmed wallet plus a friendly connection/retry notice, not invented rewards or an empty page. Reconnect and retry; check balances converge without duplicate payouts. If a game finish was interrupted, retry its retained result.
- [ ] Try a cold open while offline and document Safari's behavior. This MVP has no offline cache/service worker: a new document, uncached route or game requires a connection. Browser-native offline UI on a cold open is expected; do not promise offline play during the pitch.
- [ ] Check long chart labels and touch targets. Use Reduce Motion and confirm counters settle immediately and reward flights stop.
- [ ] Before presenting, restore connectivity, charge both devices, disable interruptions, create the presentation's fresh jury family and keep the local report videos ready as backup.

Record **device/iPadOS, pass/fail, sync seconds and screenshots** for each failure. T-62 remains open until the owner performs this physical test. Freeze (T-74) follows the games merge and this rehearsal; the agent does not redeploy.
