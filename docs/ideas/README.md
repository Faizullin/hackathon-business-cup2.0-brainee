# Ideas: original sources (frozen)

The original inputs from the product owner. **Don't edit them.** The maintained version of their content is in [../product/](../product/).

| File | What | How to use |
|---|---|---|
| `PRD Брейни.pdf` | 24-page PRD in Russian (1.9 MB, mostly images), Nov 14 2026, @Nurbek | **Agents: don't read it.** Fully condensed into `docs/product/`. Humans: open it for the original screenshots. |
| `ROUTES.md` + `brainy-mvp.zip` | Routes/roles/rules spec + clickable HTML prototype (assets/core.js fakes the API) | Condensed in [routes-spec.md](../product/routes-spec.md). Read by section; never copy its Google Fonts/cdnjs. |
| `BRAINY_30_GAMES_HANDOFF_RU.md` + `Brainy_30_Game_Handoff.zip` | 30 external learning games (US English), catalog, pinned sources, launcher | Condensed in [external-games.md](../product/external-games.md). Unzip outside the repo; don't run the launcher casually. |
| `Brainy-Funnel-Export.zip` | 25-screen US parent onboarding quiz + lavender ("AppLavender") tokens, mascot SVG, OFL fonts; static site + single-file HTML | Analysed in [funnel.md](../product/funnel.md); plan in [plans/redesign.md](../plans/redesign.md). Unzip outside the repo. |
| `claude-design/*.dc.html` | Frozen copies of the owner's Claude Design artifact (lavender child/parent apps, Brain component, stopping screens, widgets). Design-canvas source: needs a runtime to render; Google Fonts links are reference only | Spec in [design.md](../product/design.md). Port code, never load the fonts link. |
| `Прототип Брейни.html` | Single-file clickable prototype (~1,170 lines, vanilla JS, no build step) | Open in a browser to see the UX. Port code from it using the line map below. |

## Prototype line map
Read only the range you need (e.g. `sed -n '673,733p'`, or Read with offset/limit).

| Lines | What | Ports to |
|---|---|---|
| 7–285 | CSS: design tokens (`:root` colors, fonts Unbounded + Onest, dark theme) and all component styles | `packages/ui` tokens |
| 286–622 | HTML markup for all views | reference for layouts |
| 628–653 | `ICONS` (inline SVG icons) | `packages/ui` |
| 657–662 | State `S`, stat presets `START` / `NOW` / `FUN`, `STAGES` | `packages/db` seeds, `core` |
| 664–670 | `stageInfo`, `stagesHTML`: stage math + scale | `core` |
| 671–733 | `hex`, `mix`, **`brainy(s, id, acc)`**: the mascot SVG renderer | `packages/brainy` |
| 734–764 | `refresh`: re-render dock, wallet, goal | `apps/web` |
| 765–790 | `recList`, `openEntry`, `closeEntry`: entry screen + recommendations | `core` + `(child)/entry` |
| 791–816 | `dev` catalog, `devCard`, `renderLearn` | `packages/games` catalog |
| 817–867 | `shop`, `media`, `SCI`, `renderLeisure` | Leisure tab + seeds |
| 868–900 | `openPlayer`, `tick`, `drawPlayer`: science video player | `(child)` player |
| 901–982 | `shape`, `GAMES`, `startGame`, `drawRound`, `finish`: the two playable games + post-game flow | `packages/games`, `core` |
| 983–1037 | `PARTS`, `ACC`, `drawBrainyPage`, `drawAcc`, `setScen`: Brainy tab, accessories, demo scenarios | `(child)/brainy` |
| 1038–1090 | `STATUS`, `taskHTML`, `drawTasks`, `drawRecs`, `addTask`, `confirmTask` | `(parent)/tasks`, `core` |
| 1091–1108 | `drawGifts` | `(parent)/rewards` |
| 1109–1135 | `radar`, `bars`: hand-rolled SVG charts | replaced by Recharts; reference only |
| 1136–1148 | `LB` (leaderboard mock data), `drawLB`, `group` | `(parent)/analytics`, seeds |
| 1149–1170 | `VIEWS`, `PARENT`, `route`: hash router | replaced by Next.js routes |

Line numbers are for the file as committed. If it changes, regenerate them with `grep -nE '^\s*(function |const [A-Za-z_]+ ?= ?[\[{])' "Прототип Брейни.html"`.

Note: the prototype loads Google Fonts from a CDN. **Don't copy that**; use `next/font` ([rules.md](../product/rules.md#technical-requirements)).
