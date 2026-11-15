# Routes spec (condensed)

Source: `ROUTES.md` and the clickable prototype `brainy-mvp.zip` (frozen inputs, now in git history; see [original sources](../README.md#original-sources)). Decisions: [D-24](../dev/decisions.md), [D-25](../dev/decisions.md). Status: ✅ built · ◐ reduced · ⏳ later.

## Roles and access
| Spec | Ours | Status |
|---|---|---|
| Parent email + password, 30-day session | `/login` → `POST /api/auth/login`, scrypt hash, device cookie | ◐ own minimal login, no provider |
| Signup with consent; onboarding child → quiz → setup | `/onboarding`: **quiz first**, then signup (child, birth year 4–10, email, password, PIN) | ◐ D-24 |
| Child device paired by 6-digit code | `/child-login` → one-time code → own revocable device cookie | ✅ D-27 |
| Parent PIN on child device, 15 min, "Back to Child" | PIN gate, 15 min, "Back to Child" → `/entry` | ✅ PIN or adult arithmetic fallback |

## Route map (spec → ours)
| Spec | Ours |
|---|---|
| `/` role choice | `/` is a gate: a device with a family opens `/entry`, any other opens `/start`. The role picker (parent login, child login, jury) is `/login` |
| `/auth/signup`, `/onboarding/*` | `/start` (the Brain Check funnel, [funnel.md](funnel.md); one-tap `POST /api/onboarding/start`); `/onboarding` redirects to it; `/signup` (neutral/legacy) and `/onboarding/setup` stay |
| Jury preview | `/jury` after demo-only `POST /api/jury` |
| `/child/start`, `/child/learn`, `/child/play/:id` | `/entry`, `/learn`, `/game/[id]` |
| `/child/leisure`, `/child/watch/:id` | `/leisure`, `/video/[id]` (registered films only; others 404, D-39) |
| `/child/fun/:id` | `/fun/snake` (playable React game) |
| Bought cartoon | ⏳ later (no media, D-39) |
| `/child/gifts`, `/child/brainy` | `/gifts`, `/brainy` |
| `/parent`, `/parent/tasks`, `/parent/rewards` | `/analytics`, `/tasks`, `/rewards` |
| `/parent/settings` | `/settings` (fourth parent tab) |

## Rules adopted (ROUTES.md §7, §12)
- ✅ Stars +3/+4, 3-game bonus +5, video +15 ★ and eyes +2 once, exchange 1 ☀ → 10 ★, 5 tasks/day, task confirm → ☀ + week goal + resp +2.
- ✅ Mood −5 per idle day, floor 30 (computed on read, `moodNow`).
- ✅ Parent may cancel only assigned (`todo`) tasks; cancellation deletes the task without changing wallet, goal or stats. Pending confirmations and completed tasks stay protected.
- ✅ Stage never drops (stats only grow).
- ✅ Leaving mid-game pays nothing (no finish without all rounds).
- ✅ Daily bonus shared across devices, local-midnight task/streak reset and Monday goal-progress reset; read-only parent task history → [calendar resets](mechanics.md#calendar-resets).
- ✅ Saved active-play credit for Snake, repeat ten-minute top-ups, forever unlock.
- ✅ App tasks auto-complete on learning finish; earned rewards show progress, celebrate and enter the parent feed.

## Parent dashboard additions
- ✅ "Needs attention" (tasks to confirm, gifts to deliver, empty day) and an 8-item event feed (`showcase.feed`, D-25).
- ✅ Tab badges: child Gifts counts assigned real-life tasks; parent Tasks counts pending confirmations and Rewards counts undelivered requests. Counts poll with shared state and are hidden while parent access is locked.
- ✅ Learning/science minutes, streak, weekly suns, advice rate and recommended start/finish counts use saved activity. Historical/character radars and ranking stay labelled demo. Fun minutes are not yet included in analytics.

## Not adopted
SSE stream and Web Push (polling, D-15), subscription/payment, Google Fonts/cdnjs from the prototype.

## Settings and onboarding (T-103)
Settings groups child name/birth year/promise, old-PIN-checked PIN changes, timezone, paired devices and account/logout. Device lists show creation dates and the current device. Pairing/expiry/lock rules and storage: [D-27](../dev/decisions.md). The selected zone controls [calendar resets](mechanics.md#calendar-resets). The plan is a static demo card.

Onboarding keeps the five-question `quizStart` contract: one question per screen, progress, back, answer reactions, a gentle Scroll Monster story, starting-Brainy reveal, hold-to-start (tap with reduced motion), then signup. Referral entry is optional and has no backend effect. Stage increases show a child celebration and a parent event; first load does not celebrate an existing stage.

Both signup paths lead to `/onboarding/setup`: a one-time pairing code, current-domain Screen Time instructions, and child-device/parent choices. `/signup` skips the quiz using neutral answers. Jury entry is demo-only and creates an independent family with reusable credentials; Settings offers a parent-authorized content reset. Details: D-29 and [demo walkthrough](../demo.md).
