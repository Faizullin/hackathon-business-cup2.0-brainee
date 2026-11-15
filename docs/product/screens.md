# Screens

The lavender visual source is [design.md](design.md), with implementation patterns in [ui.md](../dev/ui.md). Economy and stat rules live in [mechanics.md](mechanics.md); the parent funnel contract lives in [funnel.md](funnel.md). This page describes the product surfaces without duplicating those rules.

## Child

Phone navigation and the landscape iPad rail have the same five destinations: **Learn · Leisure · Brainy · Path · Gifts**. Brainy is the raised central hub on phone. Full-screen games and players use their own chrome.

Learn, Leisure, Gifts and Explore share a compact dark Brainy summary: Energy, stage, progress toward the next stage, saved ★/☀ wallet and a labelled weekly-goal link. The zero-earned state says “Play to earn ★”; positive learning rewards show today's actual amount. Energy is the existing mood value, while growth is derived from stats. Brainy never dies, and low Energy is sleepy and kid-safe.

The Brainy tab keeps the full hero and training action. Its skill cards use the asymmetric zone-card shape. The six-accessory shop supports previews, buying, wearing and removing, with one item per slot. Earned discoveries and the stage journey live on Path.

### Entry

Every entry into child mode presents a full-screen recommendation choice, with a dark Brainy card and speech card. There is no dismiss gesture. A deliberate alternative opens the complete Learn catalog. Choosing a recommendation or other games is recorded.

`recommendGames` in core ranks supplied ability gaps and chooses distinct playable games using completed sessions from the last seven days. Age averages remain a product input, not a clinical assessment; see [mechanics.md](mechanics.md). The screen does not invent norms.

### Learn

A greeting with the child's name, date and streak replaces the large title card. The compact hero leaves room for the first game cards on phone; iPad keeps a two-column layout. Recommendations precede the learning grid. Each game card has its skill icon and wash color; a final unpaired card is centered.

Learning can earn stars through server-validated results. Game implementations report results and never grant currency themselves. Entertainment remains in Leisure; Explore opens free play without rewards.

### Game screen and no-exit flow

The host shows title, level, skills and one round-progress indicator. It uses the shared game palette and centers the board on iPad. Existing game implementations keep their own rules and rendering.

Finishing opens the saved before/after receipt, actual gains and next choices. A practice suggestion and next-level action require a deliberate tap. Stopping saves the session and returns to Brainy with thanks. After three games, the dark break card makes the stopping point prominent. The family's agreed phrase appears when a family plan exists. There is no autoplay.

### Leisure and players

Leisure separates the ★ game shop and the free interactive films; only content that exists is listed (D-39). The play-time explainer states that purchased minutes count during active play; timed passes show their remaining minutes, while permanent unlocks stay available.

Science playback supports pause and saved position, with no seek control or video switching. Registered interactive films combine local audio with drawn scenes and questions that pause playback. The child's own Brainy fills the narrator slot, including equipped accessories and a talk-driven mouth. Playback starts only after Play; in-film questions grant no rewards. Completion leads to the existing final quiz before the server grants any reward. See [films.md](../dev/films.md). Entertainment endings reuse the calm dark stopping card and the family's phrase. Current media and catalog boundaries are in [demo.md](../demo.md).

### Gifts

The weekly goal, family gift shop, parent tasks and one-way currency exchange share the saved state. Currency icons accompany violet purchase buttons. Quest rows show assigned, awaiting-confirmation and completed states; marking a real-life task done waits for the parent. Gift requests also wait for parent delivery.

### Path

Path contains weekly learning bars, five real growth stages with mini Brainys and a current-stage marker, and the discoveries grid. Earned items show their icon and “Earned ✓”; locked items use 50% opacity and retain progress. No child route shows rankings.

## Parent

The four sections are Analytics, Tasks, Gifts & goal and Settings. Bottom tabs on phone and top tabs on iPad keep the existing routes; top tabs have 44 px targets and violet active states. Parent access uses the existing PIN gate.

### Analytics

Today and Week use the parent design's dark Energy/status card, needs-attention actions, session rows, weekly bars and short progress notes. Week bars show saved learning and science minutes, not a history of daily Brainy scores. Activity events retain their source and are grouped by day. Counts come from saved activity; historical radars, character estimates and the legacy parent ranking remain explicitly illustrative demo data. They are not evidence of learning improvement.

Families created through the funnel also see **Family plan**: the agreed phrase, four small steps and an observation prompt. Parents can edit their answers and copy or download the resulting plan as plain text. Core derives the plan from validated `showcase.familyPlan` answers; editing the plan does not award currency or rewrite growth.

### Tasks

The form distinguishes real-life tasks rewarded with ☀ from supported in-app tasks rewarded with ★. Existing daily limits and confirmation rules are unchanged. Quest rows show status and a reward pill. Confirming a real-life task changes the saved balance, weekly goal and responsibility according to core rules.

A family-plan suggestion can prefill an off-screen reading task. It creates no task or reward until the parent chooses to add it; real-life completion still needs confirmation. Existing recommendation cards remain separate from this suggestion.

### Gifts & goal

Parents set the weekly goal and family gift list, then mark requests as delivered. The ★/☀ breakdown shows recent earnings and incoming exchanges, recent spending and outgoing exchanges, and a “Base and other activity” remainder. The feed holds up to 30 events, so that remainder includes the starting balance, older events and changes without enough currency detail. It is not a complete ledger. There is no payment flow.

### Settings

Lavender fields and icon blocks retain profile, PIN, child-device pairing, revocation and demo reset actions. Restyling does not change their access rules. The platform is English only, with no language selector.

## Parent start and setup

`/start` is the Brain Check funnel: a 19-screen sales quiz (habits, child, results, plan) with a live brain meter, ending on an offer with real prices and no payment (D-40, D-41). Its first question is about the child's screen time and Brainy is named only on the result screen. Children outside ages 4–10 get a friendly exit. Full spec: [funnel.md](funnel.md).

Browser storage supports resume; `?tour=1` uses session storage for review and `?reset=1` clears the quiz and the Starter Pack timer. Hash navigation and browser Back respect prerequisite answers. Every screen has a **Jury entry** button. The offer's button creates the family in one tap (`POST /api/onboarding/start`) and opens `/entry`, where the Starter Pack unlock moment plays once. `/onboarding` redirects to `/start`; the legacy `/signup` form and `/onboarding/setup` pairing remain.
