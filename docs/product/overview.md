# Product overview

Source: PRD §1–2, §9 (`docs/ideas/PRD Брейни.pdf`, Nov 14 2026). Condensed. If this file and the PDF disagree, this file is the one we keep current.

## Problem
Gen Alpha kids grew up on YouTube Kids and short videos. Endless feeds and low-quality AI content train them for fast stimulation, so long-form attention suffers. Parental controls limit time, not content quality.

## Solution: three parts
1. **Closed environment.** The device opens only our site, using built-in iOS/Android restrictions. No endless feed, no autoplay. → [rules.md](rules.md#device-lockdown)
2. **Entertainment as a reward.** Learning games earn ★, and ★ unlocks fun games, cartoons and Brainy accessories. → [mechanics.md](mechanics.md)
3. **Parent dashboard.** Skill analytics, real-life tasks paid in ☀, parent-created gifts, rankings, social share cards. → [screens.md](screens.md#parent)

Brainy, a brain-shaped mascot, is a tamagotchi shared by child and parent. Its look is computed from the child's stats. Backstory: the Scroll Monster put a spell on Brainy, and every learning game breaks it. *The algorithm is to blame, not the child.*

## Roles
The parent pays and the child uses the product. Each has their own UI over the same data, and whatever the child does is visible to the parent immediately. Switching from child to parent UI needs a **parent barrier** (PIN or an adult-level task).

| Feature | Child (4–10) | Parent (usually a mom, 23–40) |
|---|---|---|
| Brainy, stage, mood | yes, large on every screen | yes, first block in the dashboard |
| ★ and ☀ balances | yes | yes |
| Learning games, fun games, cartoons, science videos | yes | no |
| Tasks | sees them, taps "Готово" | creates and confirms them |
| Gifts | buys with ☀ | creates and delivers them |
| Skill analytics (radars, charts) | no, only through Brainy | yes |
| Rankings, comparisons, share cards | **never** | yes |

## MVP goals
- Time in learning games ≥ 1.5× time in entertainment.
- Parent opens the dashboard ≥ 4 days a week.
- Paying subscriber stays ≥ 6 months on average (churn ≤ 17% a month). That's the condition for ads to pay back at 2× ROI.

## Constraints
- Web only: a site or PWA, not a native app. All games and content are web versions.
- Russian UI, CIS market.

## Out of MVP
Native iPadOS wrapper with the Screen Time API; licensed hits (Jetpack Joyride) and libraries like National Geographic; district-vs-district and kindergarten-vs-kindergarten competitions; B2B dashboard for kindergartens and learning centers; merch; several children per family (**support it in the data model**, build the UI later).

## Open questions (TBD)
- The formula for how games raise skills, to be calibrated by an education specialist.
- Science video source at launch: open licenses, independent studios, or our own production.
- Age averages: expert estimates first, real user data later.
- How fast mood decays when the child doesn't play, and its floor.
- Science videos sit in "Отдых" (Leisure). Should there be a path from them back to learning?
- Child speech recognition for "Расскажи историю": vendor and legal setup.
