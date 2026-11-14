# Data model and events

Source: PRD §7. All stats, balances and tasks live on the server and sync between the child's device and the parent's phone. This is the spec; the real schema is `packages/db` (once it exists, the code wins and this file gets updated).

## Entities (MVP minimum)

| Entity | Key fields |
|---|---|
| Family | id, plan (subscription), created_at |
| Parent | id, family_id, email, pin (parent barrier) |
| Child | id, family_id, name, birth_year, age_league |
| BrainyState | child_id, brain, eyes, mouth, arms, legs, resp (0–100), mood (0–100), stage, start_snapshot (after quiz) |
| SkillScore | child_id, skill (6 abilities + 5 traits), value, updated_at; weekly history for radars |
| Wallet | child_id, stars, suns, week_suns, week_start |
| WeeklyGoal | child_id, target_suns, prize_gift_id, week_start |
| Game | id, name, kind (dev / fun), skills (main + secondary, with weights), levels |
| GameSession | id, child_id, game_id, level, rounds, mistakes, corrections, stars_earned, started_at, finished_at |
| ShopUnlock | child_id, item_id, type (timer / forever), expires_at |
| Video | id, kind (cartoon / popsci), duration_min, price_stars (0 for popsci), question, options, answer |
| VideoProgress | child_id, video_id, position_min, completed, answered_correctly |
| Task | id, child_id, title, kind (real / app), skill, reward, currency, status (todo / check / done), created_by (parent / recommendation), date |
| Gift | id, family_id, title, price_suns, active |
| GiftRequest | id, gift_id, child_id, status (pending / delivered), created_at |
| Accessory | id, name, slot (head / face / neck), price_stars, earnable (bool) |
| ChildAccessory | child_id, accessory_id, equipped |
| QuizAnswer | child_id, question_id, answer |

Family → many children is out of MVP in the UI but **must be possible in the schema**.

## How stats change
- Each game has skill weights: main ≈ 70%, secondary ≈ 30%.
- A finished session adds to its skills an amount that depends on level and accuracy. Skills roll up into body parts using the table in [mechanics.md](mechanics.md#stats--body-parts-each-0100).
- Prototype simplification: Continue the pattern → brain +2; Odd one out → eyes +3; science video → eyes +2; confirmed task → resp +2.
- **The exact formula is TBD** (an education specialist sets it before launch). Keep it in one function in `packages/core` so it's easy to swap.

## Analytics events (minimum)

| Group | Events |
|---|---|
| Entry screen | `entry_screen_shown`, `entry_recommendation_chosen` (game_id, rank), `entry_skipped`: the basis of *do the hard thing* |
| Games | `game_started`, `round_answered` (correct, after_mistake), `game_finished`, `next_step_chosen` (same_game_next_level / weak_skill_game / stop), `break_suggested` |
| Shop | `shop_unlock` (item, type, cost), `accessory_bought`, `accessory_equipped` |
| Video | `video_started`, `video_paused`, `video_closed` (position), `video_completed`, `video_question_answered` (correct) |
| Tasks | `task_created` (source: manual / template / recommendation), `task_marked_done_by_child`, `task_confirmed`, `weekly_goal_reached` |
| Gifts | `gift_bought`, `gift_delivered`, `suns_exchanged` |
| Brainy | `stage_up` (from, to): triggers a push to the parent |
| Sharing | `share_card_opened`, `share_card_shared` (referral_code) |
