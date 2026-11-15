# Brain Check funnel (`/start`)

A short web2app sales quiz for US parents of kids 4–10. The parent answers questions about their child's behaviour, watches the child's brain visibly deteriorate as they answer, sees the result as **their child's Brainy**, gets reassurance and a solution, builds a plan and lands on an offer. One tap on the offer creates the family (no forms) and opens the child app, where an exclusive Starter Pack waits. Decisions: D-35 (funnel at `/start`), D-40 (full brain-rot look in the funnel only), D-41 (offer without payment). Visual and behavioural reference: [ideas/brain-check-funnel-mockup.html](../ideas/brain-check-funnel-mockup.html) (frozen; where this page and the mockup disagree, this page wins). Product context: prices from the financial model, $14.99 a month and $79.99 a year; **no money is ever taken**.

Code: rules in [`packages/core/src/funnel-quiz.ts`](../../packages/core/src/funnel-quiz.ts) (pure, tested); UI in [`apps/web/src/components/funnel/`](../../apps/web/src/components/funnel/) (`Funnel.tsx` controller, `screens.tsx`, `BrainPanel.tsx`, `funnel.css`, `quiz-copy.ts`); start endpoint `POST /api/onboarding/start`; family creation in [`packages/db/src/funnel-store.ts`](../../packages/db/src/funnel-store.ts).

## Routing

- `/` is a server gate: a device with a valid family session opens `/entry`, any other device opens `/start`. The role picker lives at `/login` (parent login, child login, jury).
- `/start` on a device that already has a family shows one card, "Your Brainy is ready" with **Open Brainy** and a secondary **Start over** (clears the funnel storage only).
- `?reset=1` clears the funnel storage and the Starter Pack timer and shows the quiz even on a device with a family, so the quiz can be shown repeatedly. `?tour=1` keeps the review run in session storage and never touches the saved answers.
- `/onboarding` redirects to `/start`. `/signup` stays in the code (it reads the adapted funnel draft) but is not on the main path.
- Every screen, including the offer, has a **Jury entry** pill in the header (`POST /api/jury`, then `/jury`); the footer has "I already have an account" (`/login`).
- Hash steps (`#duration` …), browser Back and localStorage resume work; deep links cannot skip unanswered screens (`reachable`).

## Screens

Behaviour questions come first; Brainy is named only on the result screen. Four progress segments: Habits, Your child, Results, Your plan.

| # | id | Type | Notes |
|---|---|---|---|
| 1 | `duration` | single, dark card | Kicker "1-minute brain check for parents"; five buckets from under 30 min to more than 4 h; legal line |
| 2–5 | `content`, `finish`, `handoff`, `reading` | single | Each answer moves on by itself after the brain reacts |
| 6 | `child` | form | Optional first name (fallback "your kid"), age chips 4–5 / 6–7 / 8–10 / Other. **Other** opens the exit screen (email "Notify me", no offer; the email is kept only in this browser) |
| 7–8 | `guilt`, `limits` | 1–5 scale | Statement card with the scale directly under it |
| 9 | `attempt` | multi | "Nothing yet" is exclusive |
| 10 | `analyze` | loader ~4 s | Quote block is a `[Real quote from a parent interview]` placeholder; never invent testimonials |
| 11 | `reveal` | spread | The brain at the final score, `NN / 100`, three signal bars (Focus, Reading, Calm endings) with a typical-for-age marker. "A playful indicator, not a medical assessment" |
| 12 | `ontime` | spread | "You're right on time", feed illustration, stat **14×** with its source (Common Sense Census, 2025) |
| 13 | `goal` | multi | What the parent wants in 4 weeks |
| 14 | `solution` | card | The 5 stages (Sleepy to Genius) rendered with the real `Brainy` at rising mood; pins "{Name} today" and "In 4 weeks" (two stages up, capped at Genius); closed world, fun as a reward, parent cabinet |
| 15 | `minutes` | single | 10 / 15 (recommended) / 20 minutes a day |
| 16 | `gift` | tiles | Ice cream 3 ☀, Movie night 10 ☀, Theme park 15 ☀, Choose later |
| 17 | `build` | loader + dialog | Pauses at about half of row 2: "Should {name} earn screen time instead of just getting it?" |
| 18 | `email` | input | Optional; Continue is always enabled; validated only when filled |
| 19 | `offer` | spread | See below |

Desktop fits a 16:9 window without scrolling (verified at 1280×650, 1366×680, 1440×780, 1920×960 and the 1180×820 iPad; the frame is `100svh`). Phones may scroll but have no horizontal overflow.

## The brain meter (D-40)

- **Health = mood.** It starts at **80**; each behaviour answer subtracts a drain, computed from the answers every time (never accumulated), so Back and changed answers stay correct. Floor 11 (the worst possible answers give 12).

  | Question | Drains |
  |---|---|
  | duration | 2 / 6 / 10 / 14 / 18 |
  | content | 14 (clips) / 10 (YouTube Kids) / 6 (cartoons) / 6 (games) / 2 (learning apps) |
  | finish | 0 / 6 / 12 / 4 |
  | handoff | 0 / 3 / 7 / 12 |
  | reading | 0 / 3 / 9 / 12 |

- Rot spots appear below 60, stink below 50 and flies below 45 (`packages/brainy/src/model.ts`). All-good answers stay at 76 or more (clean, pink); a typical iPad-kid path (2–4 h, Shorts, keeps switching, "Just one more!", rarely reads) lands at 24 (full rot, stink, flies); middle answers show spots without flies. Unit tests cover the three profiles.
- **Body stats** of the funnel brain are `quizStart` of the five behaviour answers (unanswered counts as the best value), so it has the same stage and size the app will save.
- The brain renders with `effects="full"`, **only inside `/start`**; every child surface keeps `effects="kid"` (an e2e test checks that no child route renders `data-effects="full"`).
- The Brain check panel (a dark column beside the card, a strip above it on phones) shows the brain on the lavender disc, a pink "−N" chip for about a second after each answer, the score in Unbounded and a gauge. It does not use the word "Brainy".

## Offer (D-41)

- Light-pink strip: "Starter Pack reserved for MM:SS". **Honest timer:** 15 minutes from the first offer view, the deadline is stored in localStorage and is never reset by reload or Back (only `?reset=1`). On expiry the strip says "Starter Pack expired. Plans and prices stay the same.", the bonus card fades and is struck through, **prices never change** and no Starter Pack is granted.
- Dark left panel: "{Name}'s plan is ready", brain today (current health) to In 4 weeks (healthy, two stages up), four rows (minutes of games, closed world, tasks and the picked reward, 6-skill dashboard).
- Plans come from `MONTHLY = 14.99` and `ANNUAL = 79.99` (`commercialPlans()`): **Yearly** (preselected, "Best value", "Save 56%", $6.67 a month, struck $179.88, $79.99 per year) and **Monthly** ($179.88 a year, $14.99 per month). One legal line follows the selected plan.
- **No card, PIN, email or password fields.** The CTA "Start {name}'s plan" calls `POST /api/onboarding/start` and goes to `/entry`.

## One-tap start

`POST /api/onboarding/start` takes `{ funnel, childName?, email?, plan, starterPack }`; `parseStartRequest` validates it in core. The server reuses `signupFromQuiz` (as `createJuryFamily` does):

- generated login `family-<uuid>@brainee.example` and a random password; PIN `1234`; a typed parent email is stored only as the contact email (`showcase.startPlan.contactEmail`);
- child name (fallback "Your kid"), birth year in the middle of the age band, time zone `America/New_York`, `QuizAnswers` from the five behaviour answers;
- the Brainy starts at the funnel health as its **mood** (clamped to `MOOD_FLOOR`…100), so the child sees the kid-safe version of what the parent saw;
- `families.plan` stays `"demo"` (it is the family-type marker, not the subscription). The chosen plan, gift, minutes per day and the "earn screen time" answer are stored in `showcase.startPlan` for display; the gift becomes the weekly goal reward;
- the funnel answers are adapted to the saved single-choice shape (`toFamilyPlan`: goal to the first mapped old goal, attempt to the first mapped old attempt, moment `flex`) and stored as `showcase.familyPlan`, so the Family plan card, the stopping phrase and the reading task keep working;
- the access cookie is set exactly like signup (parent unlocked for the normal 15 minutes) and the generated credentials come back; the funnel keeps them in `sessionStorage` (`brainee-family-login`) and parent Settings shows a "Your login" card with login, password and PIN 1234.

## Hero Cape and the Starter Pack moment

When `starterPack` is granted: +100 ★ on top of the starting 50 ★ (150 total), the exclusive `cape` accessory (slot `back`, no shop price) is owned **and worn**, and `showcase.starterPack = "pending"`. The first visit to `/entry` shows a full-screen unlock moment (gift box opens, the cape flies onto Brainy, "Starter Pack unlocked", a gold "Exclusive" badge, "+100 ★" counts into the wallet, **Let's play**); the button sends `starter-seen`, so it is never shown again. Reduced motion shows the final state. In the Brainy wardrobe the cape has a gold "Exclusive · Starter Pack" ribbon and is never purchasable; the shop lists `SHOP_ACCESSORIES` only. The cape is drawn behind the body, so Brainy's silhouette changes, and is visible in `/lab/brainy`.

## Product rules that still apply

No medical or diagnostic wording. Blame the feed, never the parent or the child. No invented testimonials, user counts or ratings; statistics only with a source. No feeds or autoplay. Kids never see rankings or the rot look. Everything stays first-party (fonts, icons, art from our origin; no analytics, no payment provider). English only.

## Visual system

Lavender canvas (`#F2F1FA`), white cards (radius 28), dark ink panels (`#1C1B33`) for the brain, violet primary buttons with an arrow, radio-row answers, line icons only. Tokens: [design.md](design.md). The CSS lives in `funnel.css`, nested under `.bc` so nothing leaks into the app.
