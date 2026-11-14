# Rules, constraints and acceptance

Source: PRD §8–9.

## Device lockdown
At first we use built-in OS tools; a native wrapper automates this later.
- **iPad / iPhone (Screen Time):** Web Content → "Allowed Websites Only" with only our domain on the list (the filter applies in every browser). Block app installs. Set limits on Entertainment, Games and Social. Add the site to the Home Screen as a PWA.
- **Android (Google Family Link):** block apps; allow only approved sites in Chrome.
- **Onboarding:** a step-by-step wizard with a video for each step, plus a check that the allowlist is on (try to open an external link).
- **Next stage (out of MVP):** a thin native iPadOS wrapper with web games inside and the Screen Time API (Family Controls), so one parent permission blocks everything else. Needs an Apple entitlement.

## Technical requirements
- **Every resource (games, images, video, fonts, API, auth) is served from our domain or its subdomains.** Anything else gets blocked by the allowlist.
- No YouTube embeds.
- Payments happen on the parent's phone.

## Privacy
- Rankings show first name + last initial only. No photo, no exact address.
- District ranking is shown only when the zone has > 50 children. Zones are large (a city district, not a block).
- Child data is collected with parental consent. Before launch, a legal review per country: local data laws, GDPR, COPPA if entering the US.
- Child voice ("Расскажи историю") is sensitive: process it on-device, or get explicit consent and keep it only briefly.
- Leaving the child UI (to the parent dashboard, sharing, external links) goes **only through the parent barrier**. This is also an app store requirement for kids' apps.

## Product rules
- No endless feed, autoplay or "watch next" recommendations.
- The learning flow has an end: a break after 3 games in a row, and a «Хватит на сегодня» button.
- Brainy never gets sick or dies.
- The child never sees comparisons with other children.
- Character analytics is an "индикатор" (indicator), not a diagnosis. Compare with the «среднее по возрасту среди пользователей» (average for that age among our users), not a «норма развития» (developmental norm).
- No ADHD-prevention promises and no medical wording, in marketing or UI.
- No third-party characters or brands. Naming meme content in the quiz is fine; using it in visuals is not.

## MVP acceptance criteria
- [ ] Entry screen shows on every entry into child mode, can't be closed without a choice, picks 3 games by skill gap, and logs the choice.
- [ ] After a game: Brainy before → after, two next-step options, and «Хватит на сегодня». After 3 games in a row: a break and a bonus.
- [ ] Brainy's stats and stage recalculate after each game and update for both child and parent without a reload.
- [ ] Accessories can be bought, worn and removed, one per slot, and show everywhere Brainy appears.
- [ ] Science video: pause only, position saved on close, ★ granted only after a correct answer.
- [ ] Task: child taps «Готово» → parent confirms → ☀ goes to the balance and the weekly goal, and `resp` grows.
- [ ] Gifts cost ☀ only. Exchange only ☀ → ★ at 1 : 10.
- [ ] The 5-tasks-a-day limit is enforced.
- [ ] Ranking is never shown to the child and hides last names.
- [ ] Every site resource loads from our own domain, and the site works with the Screen Time allowlist on.
