# Screens

Source: PRD §5–6. Economy and stat numbers live in [mechanics.md](mechanics.md); they aren't repeated here.

## Child

Four tabs: **«Учимся»** (Learn), **«Отдых»** (Leisure), **«Подарки»** (Gifts), **«Брейни»**. The Brainy dock sits above Learn, Leisure and Gifts, and is hidden on the game screen.

### Brainy dock (every child screen)
- Large Brainy (~136px). Tapping it opens the Brainy tab.
- Stage chip, mood bar, distance to the next stage.
- Wallet: ★ and ☀.
- Weekly goal progress ("6 / 10 ☀"). Tapping it opens Gifts.

### Entry screen «Во что играем сейчас?»
The platform's recommendation outweighs the child's wish. Otherwise kids play one favorite game for months.
- Full screen on **every** entry into child mode. **No close button or swipe.**
- Brainy says: «Мне нужно подкачать „внимание". Поможешь?»
- 2–3 large learning-game cards for the skills furthest below the age average. The first is tagged «Важнее всего сейчас». Each card shows its reason, e.g. «Внимание 41 при среднем 52».
- A small, low-key link at the bottom, «Нет, хочу посмотреть другие игры», leads to Learn.
- The choice is logged (took the recommendation vs. other games). This is the *do the hard thing* metric.
- **Algorithm (MVP):** for each of the 6 skills, compute gap = value − age average. Sort ascending and take the first 3. For each, pick that skill's game the child played least in the last 7 days.

### Learn «Учимся»
- «Брейни советует» block: the same 3 recommendations with reasons.
- «Все развивающие игры» block: a grid of cards showing the skill and maximum reward.
- **Stars are earned only here.** No entertainment is shown on this tab.

Learning game catalog (MVP):

| Game | Main skill | Mechanic |
|---|---|---|
| Найди лишний (Odd one out) | attention | 9 or 12 shapes; one differs in color, shape or size |
| Продолжи узор (Continue the pattern) | logic | a row of shapes; pick the next one from 3 options |
| Звуки и буквы (Sounds & letters) | reading | match a sound to a letter, build a syllable |
| Повтори за Брейни (Repeat after Brainy) | memory | remember and repeat a sequence |
| Расскажи историю (Tell a story) | speech | tell a story from pictures (microphone; see [rules.md](rules.md#privacy)) |
| Волшебный сад (Magic garden) | long game | a plant grows over days; harvest now or wait for more |
| Экспедиция (Expedition) | learning machine | a new location with unknown rules; figure them out by experimenting |
| Детектив ошибок (Error detective) | learning from mistakes | find mistakes in a robot's solutions |

Playable in the prototype: Odd one out and Continue the pattern, 2 levels each, 4 rounds per level.

### Game screen and no-exit flow
- Header: title, level, skill chips (main + secondary), round progress, stars this session.
- Wrong answer: the card shakes, hint «Почти! Присмотрись». Correct after a mistake: «Звезда за исправление! +4».
- After the last round the child **does not return to the menu**. «Игра пройдена!» shows Brainy before → after and the stat gain ("Глаза +3").
- Two large «Что дальше?» cards right away: a game for the weakest skill, and the next level of this game.
- Below them, «Хватит на сегодня» goes to the Brainy tab with a thank-you.
- After 3 games in a row: +5★ bonus, a «Брейни советует сделать перерыв» banner, and the main button becomes «Сделать перерыв». **The flow has an end. This is the line between us and autoplay.**

### Leisure «Отдых»
A separate tab, so entertainment isn't in view right after 1–2 learning games.
- **Game shop (★):** Змейка (Snake, spatial thinking), Ракета-раннер (Rocket runner, reaction), Ритм-барабаны (Rhythm drums, rhythm), Катапульта (Catapult, accuracy), Лабиринт-гонки (Maze race, dexterity). Two buttons each: «10 мин · 30★» and «Навсегда · 500★». A timed unlock shows minutes left. All are our own takes on popular genres; famous titles only under license (out of MVP).
- **Cartoons and fairy tales (★):** no "watch next" row after an episode.
- **Science videos (free):** long educational films, 20–26 min. Player below.

### Science video player
- The only control is pause/play. No seeking, scrubber or switching videos. The progress bar shows position only and isn't tappable.
- «Закрыть и досмотреть позже» saves the position. The card then shows «Продолжить с 9 мин».
- After the last minute: a 3-option question about the content. Correct: +15★ and Brainy's eyes +2. Wrong: that option fades and the child tries again.
- Age length limit (proposal): ages 4–5, up to 20 min. Prototype speeds time up: 1 s = 1 min.

### Gifts «Подарки»
- Large weekly goal card: «Собери 10 солнышек и получи: Поход в кино», with progress.
- Parent's gift shop: a ☀ price button, disabled if the child can't afford it. The goal prize is marked. Buying sends the parent a "deliver" request.
- Tasks from mom: real-life tasks with «Готово!» (status → «Ждёт подтверждения»); in-app tasks marked «Засчитается само».
- Exchange: «1 ☀ на 10 ★».

### Brainy «Брейни»
- Large Brainy with a line suggesting a game for the weakest stat.
- 5-stage scale with the current stage and distance to the next.
- Accessory shop: preview of Brainy wearing each item, «Купить · N★» / «Надеть» / «Снять».
- Five body-part stats, each labelled with the skills that train it.
- Earned rewards; ones not yet earned are dashed.
- *Demo block (for the team, not the product):* scenarios «После квиза / Сейчас / Только развлечения» plus a slider by weeks.

## Parent

Three tabs: **«Аналитика»** (Analytics), **«Задания»** (Tasks), **«Подарки и цель»** (Gifts & goal). The dashboard must give a reason to come back daily: confirm a task, check on Brainy, assign a recommendation.

### Analytics «Аналитика» (top to bottom)
1. **Brainy hero:** large Brainy with accessories, child's name and age, stage, the path «Сонный → Умник», 5-stage scale, mood, plus a small "after quiz" Brainy for comparison.
2. **4 key metrics:** average focus session (min), day streak, ☀ this week vs. goal, share of entries where the child took Brainy's recommendation.
3. **Insight:** most-improved and most-lagging skill vs. age average, with a link to recommendations in Tasks.
4. **Skill radar** (6 axes: speech, reading, logic, attention, memory, fine motor). Three outlines: now, a month ago, age average (dashed).
5. **Character radar** (5 axes: long game, learning machine, do the hard thing, learning from mistakes, responsibility). Caption: «Индикатор по игровому поведению, а не тест».
6. **Time this week:** bars per day, split into learning games, science videos and entertainment.
7. **Do the hard thing:** share of entries per week where the child chose the recommended game, and how many recommended games they finished.
8. **Ranking:** age league, monthly season. Toggles «Район / Город / Страна» and «По росту / Абсолютный». The child's row is highlighted, with a summary like «3-е место по росту из 312 · топ-1%».
9. **Monthly recap for Stories:** card with Brainy, stage, 2–3 achievements, referral code, «Поделиться» button (system share sheet).

### Tasks «Задания»
- **Form:** what to do; where (real life → ☀, in app → ★; the reward field label changes); which skill it trains; reward.
- **Age templates:** «Убраться» 2☀, «Улица» 1☀, «Книжка» 3☀, «Домашка сам» 2☀, «Пятёрка» 3☀. Tip below them: rewarding effort works better than rewarding grades.
- **Today:** list with statuses «Назначено» → «Ждёт подтверждения» (button «Подтвердить») → «Выполнено». Chip «Обещание ребёнка: 3 задания»: a goal the child sets for themselves.
- **Limit: 5 tasks a day**, so the platform doesn't become a control tool. Counter and bar at the top.
- **Confirming a real-life task:** +☀ to the balance, +weekly goal progress, Brainy `resp` +2. When the goal is reached, notify «Цель недели выполнена! Подарок: …».
- **Recommendations from Brainy's stats:** lagging skills, each with a bar marking the age average, the Brainy part it trains, a behavioral reason («бросает задания на внимание через 4–5 минут»), and 1–2 concrete real-life tasks with reward and duration. «Назначить» adds the task to Today and removes it from recommendations.

| Skill | Example task | Reward |
|---|---|---|
| Attention | build a 60-piece puzzle with the parent, 20 min | 3☀ |
| Attention | play "Freeze" on a walk, 10 min | 1☀ |
| Do the hard thing | make a clay figure they've never tried, 25 min | 2☀ |
| Reading | read 5 shop signs on the way home, 10 min | 1☀ |

### Gifts & goal «Подарки и цель»
- Rules banner: 1☀ = 10★, one-way exchange, gifts only for ☀.
- Weekly goal: ☀ target due Sunday, prize picked from the gift list, progress.
- Gift shop: list with prices and «Убрать». «Новый подарок» form: title, ☀ price. Starter set: Поход в кино 10, Мороженое 3, Набор наклеек 2, Выбрать мультик на вечер 4, Парк аттракционов 15.
- Requests from the child: what they bought and when, with a «Вручено» button.
