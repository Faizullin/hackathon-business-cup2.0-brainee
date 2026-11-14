# Routes spec (condensed)

Source: [ROUTES.md](../ideas/ROUTES.md) and the clickable prototype `docs/ideas/brainy-mvp.zip` (frozen inputs). Decisions: [D-24](../dev/decisions.md), [D-25](../dev/decisions.md). Status: ✅ built · ◐ reduced · ⏳ later.

## Roles and access
| Spec | Ours | Status |
|---|---|---|
| Parent email + password, 30-day session | `/login` → `POST /api/auth/login`, scrypt hash, device cookie | ◐ own minimal login, no provider |
| Signup with consent; onboarding child → quiz → setup | `/onboarding`: **quiz first**, then signup (child, birth year 4–10, email, password, PIN) | ◐ D-24 |
| Child device paired by 6-digit code | device cookie from signup/login/demo | ⏳ pairing codes |
| Parent PIN on child device, 15 min, «Вернуть ребёнку» | PIN gate, 15 min, «Вернуть ребёнку» → `/entry` | ✅ (adult-task fallback ⏳) |

## Route map (spec → ours)
| Spec | Ours |
|---|---|
| `/` role choice | `/` → `/entry`; `/login` has child + parent entry |
| `/auth/signup`, `/onboarding/*` | `/onboarding` |
| `/child/start`, `/child/learn`, `/child/play/:id` | `/entry`, `/learn`, `/game/[id]` |
| `/child/leisure`, `/child/watch/:id` | `/leisure`, `/video/[id]` |
| `/child/fun/:id` | ⏳ (fun games have no content yet) |
| `/child/gifts`, `/child/brainy` | `/gifts`, `/brainy` |
| `/parent`, `/parent/tasks`, `/parent/rewards` | `/analytics`, `/tasks`, `/rewards` |
| `/parent/settings` | ⏳ |

## Rules adopted (ROUTES.md §7, §12)
- ✅ Stars +3/+4, 3-game bonus +5, video +15 ★ and eyes +2 once, exchange 1 ☀ → 10 ★, 5 tasks/day, task confirm → ☀ + week goal + resp +2.
- ✅ Mood −5 per idle day, floor 30 (computed on read, `moodNow`).
- ✅ Parent may cancel only assigned (`todo`) tasks; cancellation deletes the task without changing wallet, goal or stats. Pending confirmations and completed tasks stay protected.
- ✅ Stage never drops (stats only grow).
- ✅ Leaving mid-game pays nothing (no finish without all rounds).
- ✅ Daily bonus shared across devices, local-midnight task/streak reset and Monday goal-progress reset; read-only parent task history → [calendar resets](mechanics.md#calendar-resets).
- ⏳ Fun timer counting play time only, cartoon player.

## Parent dashboard additions
- ✅ «Требует внимания» (tasks to confirm, gifts to deliver, empty day) and an 8-item event feed (`showcase.feed`, D-25).
- ✅ Tab badges: child Gifts counts assigned real-life tasks; parent Tasks counts pending confirmations and Rewards counts undelivered requests. Counts poll with shared state and are hidden while parent access is locked.
- ⏳ Study:fun ratio line and "first week" placeholder.

## Not adopted
SSE stream and Web Push (polling, D-15), subscription/payment, Google Fonts/cdnjs from the prototype.
