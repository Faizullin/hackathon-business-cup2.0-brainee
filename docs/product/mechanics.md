# Mechanics: economy and Brainy

Source: PRD §3–4. Implement in `packages/core` (logic) and `packages/brainy` (SVG).

## Two currencies

| | ★ Stars | ☀ Suns |
|---|---|---|
| Earned from | learning games, finished science videos, parent's in-app tasks, streak bonus | parent's **real-life** tasks, after the parent confirms |
| Spent on | fun games (10 min or forever), cartoons and fairy tales, Brainy accessories | parent's gifts, or exchange for ★ |
| Price set by | platform | parent |
| Prototype starting balance | 340 | 6 |

- **Exchange is one-way only: 1☀ = 10★.** ★ can never become ☀.
- **Real gifts cost ☀ only.** Otherwise a kid would "farm" cinema trips and sweets for hours on the tablet. ☀ is earned only away from the screen, with the parent's confirmation.

### Star rules (MVP)
| Event | Reward |
|---|---|
| Learning-game round solved on the first try | +3★ |
| Mistake, then corrected ("звезда за исправление"; trains *learning from mistakes*) | +4★ |
| Science video watched to the end + correct answer | +15★ |
| 3 learning games in a row | +5★ once per child per local day, plus a break suggestion |

### Shop prices (prototype reference)
Fun game 10 min: 30–40★; forever: 450–600★. Cartoon: 30–60★. Accessory: 50–120★.

### Weekly goal
The parent sets a ☀ target due Sunday and a prize. It counts **☀ earned this week, not the current balance**, so buying a gift doesn't reduce goal progress.

### Calendar resets
Days use the saved family timezone (default: `America/New_York`; Settings offers eleven zones, and signup accepts a supported browser zone). At local midnight, all device streaks and the shared daily bonus flag reset. Yesterday's completed tasks move to history; assigned and awaiting-confirmation tasks become `expired`. They cannot earn rewards later. Today starts empty, with a fresh five-task quota. Parent history retains the latest 100 tasks.

On Monday at local midnight, weekly earned ☀ resets to zero; the goal target and prize stay. Wallets, stats, purchases, gift requests and solved videos are preserved. Rollover happens on reads and relevant writes, including after several idle days, without a cron job. A game finished across midnight counts in the new day; replaying an old receipt pays nothing again. Stopping or opening another device never renews the day's bonus. Changing timezone settles the old calendar and applies the selected zone immediately; it never renews an already claimed bonus. Persistence: [D-26/D-27](../dev/decisions.md).

## Brainy

A brain with eyes, mouth, arms and legs. Its look is computed from stats, so progress shows without numbers: motivation for the child, proof for the parent. In the MVP it's an SVG drawn from formulas, as in the prototype's `brainy(stats, id, accessories)` (see [ideas/README.md](../ideas/README.md)).

### Stats → body parts (each 0–100)
| Part | Stat | Trained by | Visual change |
|---|---|---|---|
| Brain | `brain` | logic, memory | head size; a star when > 72 |
| Eyes | `eyes` | attention, concentration, science videos | eyelid openness; dark circles < 45; "z z" < 35 |
| Mouth | `mouth` | speech, reading | smile or frown (line curvature) |
| Arms | `arms` | fine motor, dexterity (fun games) | thickness; biceps > 55 |
| Legs | `legs` | reaction, coordination (fun games) | length and thickness |
| Captain's backpack | `resp` | responsibility: parent tasks | appears at ≥ 70 |

- Body color shifts smoothly from pale "sleepy" green to pink by the **average of the five body stats**. Below an average of 38, "video screens" fly around Brainy.

### Stages
Stage = average of brain, eyes, mouth, arms, legs. Moving up a stage triggers an animation and a **push notification to the parent**.

| Сонный (Sleepy) | Проснувшийся (Awake) | Бодрый (Lively) | Умник (Smart) | Гений (Genius) |
|---|---|---|---|---|
| 0 | 25 | 40 | 55 | 70 |

### Mood (самочувствие)
A separate 0–100% scale for **recent activity, not skill**. +8 points per completed game, slowly decays on days without play (rate TBD). Brainy gets sad and bored but **never gets sick or dies**: fear of losing a pet makes both child and parent anxious.

### Accessories
- **Bought with ★ (cosmetic):** cowboy hat 120, cap 60, headphones 90, glasses 80, bow tie 50, scarf 70. Slots: head, face, neck. One item per slot; can be worn and removed.
- **Earned (can't be bought):** captain's backpack (Responsibility), explorer badge (Learning machine), own garden (Long game), hero cape (Do the hard thing; unlocks at 50). Ones not yet earned are shown dashed.
- Worn accessories appear **everywhere** Brainy is shown: child dock, entry screen, parent dashboard, story card.

### Onboarding quiz → starting Brainy
At sign-up the parent answers a habits quiz about the child:
- hours a day on a phone
- what they watch (shorts, YouTube Kids, meme content)
- whether they finish a 10-minute cartoon
- how they react when the phone is taken away
- whether they read on their own

Worse habits make a sleepier starting Brainy. Prototype start: brain 18, eyes 16, mouth 14, arms 14, legs 18 (resp 10). The answers are also the "before" baseline for the parent's "before / after" analytics.

## Skills
- **6 abilities** (skill radar): speech, reading, logic, attention, memory, fine motor.
- **5 character traits** (character radar): long game, learning machine, do the hard thing, learning from mistakes, responsibility.

How games move these numbers: [data-model.md](data-model.md#how-stats-change).
