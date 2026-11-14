# External learning games (30-game handoff, condensed)

Source: the 30-game handoff (`.md` + `.zip`, in git history at `b1a3c68` under `docs/ideas/`; see [ideas/README.md](../ideas/README.md)) (catalog, pinned sources, `launch_games.py`, H5P starter content). Decision: [D-25](../dev/decisions.md); locale/age: D-22.

- **Audience in the handoff:** US English, Grade 1–3 (15 games for 6–7, 15 for ~8). English is now allowed (D-30 and the game-expansion instruction); preserve source English when it avoids unnecessary rewriting.
- **Sources and licences (checked on GitHub):** QLOBE-kids 15 games (MIT), Sugarizer 11 (Apache-2.0), H5P Drag Text / Sort Paragraphs / Dictation 3 (MIT, player h5p-standalone MIT), Blockly Games maze 1 (Apache-2.0). Bundled media can carry its own terms: keep each game's LICENSE/CREDITS.
- **Integration = path C** ([games.md](../dev/games.md#scaling-three-paths-in-one-contract-d-16)): pinned, checksummed static builds served from our origin; T-29 bridge + `IframeGame`; one adapter per game that reports real attempts as our unchanged `GameResult`; the handoff's manifest is a draft for T-89; conformance (T-90) before listing.
- **Per-game work:** harder levels (QLOBE targets 4–6), content banks (3 levels × ≥4 sessions), English text/voice, removing Sugarizer journal/home and external fonts.
- **First wave (handoff):** Tangram Tales, Sentence Workshop, Secret Message Lab, Rhythm Copycat, Target Number Lab, Mirror Grid, Context Clues, Paragraph Detective, Code the Maze, Reading Detective. **Our first pick: Tangram Tales** (QLOBE, no build step, logic 0.7 + motor 0.3, little text), after Picture Puzzle (T-85).
- **`launch_games.py`:** developer-only, downloads from the internet; run once after review for chosen games, commit only the built output. Never fetch at runtime.

## Import status (2026-11-14)

| Game | Status | Scope |
|---|---|---|
| Tangram Tales | Scored, simplified | Four silhouettes; select/place with snapped orientation; logic .7 / motor .3, 6+. |
| Mirror Grid | Scored, simplified | Sugarizer reflection without journal/server; logic .7 / attention .3, 7+. |
| Rhythm Copycat | Scored, simplified | Four rhythm sequences, three levels; memory .7 / attention .3, 5+. |
| Secret Message Lab | Scored, simplified | Four visual-memory tasks, three levels; memory .7 / attention .3, 6+. |
| Neighborhood Route Planner | Explore preview | Original drawing/road/landmark play, English content; no learning score or rewards. |
| Magnet Explorer | Explore preview | Original three exploration modes, English content; no learning score or rewards. |
| Code the Maze | Recommended next scored candidate | Strong problem-solving progression and existing locales; needs local Blockly export and real mission hooks. |
| Shape Detective, Target Number Lab, Last Token Challenge | Next candidates | Language-light tasks; retain original UI first, then review attempt/completion events. |
| Sentence Workshop, Paragraph Detective, Meaning Match Memory, Clock Missions | Later | Content/player adapters; English is allowed. Clock should use 24-hour missions. |
| Sink-or-float, shadow, physics | Possible Explore previews | Keep free exploration unscored until authored missions exist. |
| Puppet Retell | Skipped | Microphone/privacy scope. |
| Listen & Write; Word Maze / Reading Detective / Context Clues | Later | English may remain; review audio interaction and reading suitability before importing. |

### Faster import policy

Preserve the original game in a same-origin iframe whenever its controls work on iPad. Pin and verify files, retain LICENSE/credits, remove external dependencies, add loading/exit handling, then check real input and network isolation. This preview path avoids rewriting gameplay, translating everything and inventing four-round scoring for creative activities. It still requires control and asset checks: an upstream launcher probe does not establish Safari compatibility.

Promote a small selected set to Learn using explicit correct/incorrect attempt hooks and the existing session/reward contract. Never turn a generic button press, time spent or closing an iframe into a learning success. Preview usage analytics could later record opens/exits separately, but this batch deliberately does not submit previews to learning analytics. Prefer Neighborhood for its illustrated creative experience and Magnet for direct experimentation; keep the main learning games prominent.

## 30-game audit and faster delivery proposal (2026-11-15)

Repository inspection, not a new browser acceptance run: 6/30 archive entries are integrated (four scored, two Explore); 24 remain. The app's other three scored games (Odd One Out, Continue the Pattern, Picture Puzzle) are outside this archive. Pattern Train is a separate unimported title, despite similar mechanics to Continue the Pattern. Existing input failures remain T-113.

The archive contains catalog/specification, pinned source inventories, a Python fetch/preview/export launcher, three H5P library archives and starter content/audio. It is not 30 ready-to-ship offline games. The launcher already offers a common iframe preview page and family-level source preparation; its preview permissions and compatibility patches need review before app use. No launcher or upstream game code was executed during this audit.

### Remaining inventory

| Family | Integrated | Remaining titles |
|---|---|---|
| QLOBE (15) | Tangram, Rhythm, Secret Message; Magnet and Neighborhood previews | Sentence Workshop; Word Train; Tens & Ones; Pattern Train; Garden Data Detectives; Shape Detective; Sink or Float; Shadow Investigation; Story Sequence; Puppet Story Studio |
| Sugarizer (11) | Mirror Grid | Target Number Lab; Fraction Number Line; Clock & Time Missions; Food Chain Detective; Motion & Ramp Lab; Planet Detective; Word Maze; Reading Detective; Last Token Challenge; Meaning Match Memory |
| H5P (3) | None | Context Clues Quest; Paragraph Detective; Listen & Write |
| Blockly (1) | None | Code the Maze |

### Why delivery has been slow

Previous scored imports included bespoke four-task sessions, level generation, scoring/correction hooks, saved rewards, replay protection, skill/history integration and localization. Tangram also replaced drag/rotation with guided selection/placement. These are substantially more work than embedding existing gameplay. Recorded WebKit input failures and the Chromium/WebKit phone/iPad matrix added stabilization work. There is no timing measurement establishing a precise speedup.

The container already exists in `ExplorePlayer.tsx`, using the shared bridge for lifecycle only. Remaining duplication includes hardcoded build/registry lists, per-game asset path patches and per-game wrappers. A new universal game engine would add work unnecessarily.

### Proposed next implementation, not yet implemented

1. Extend the existing Explore route/player with declarative metadata: source family, local entry, viewport sizing (responsive or fixed-aspect contain), orientation preference, audio capability and readiness strategy. Keep age gates, loading/error/retry, exit and teardown common. Use available viewport height with a shrinkable flex stage; iframe width alone cannot fix a fixed-size canvas. Apply small family/game resize adapters where needed.
2. Add a deterministic import/build helper using pinned sources and checksums. Generate registration from validated metadata rather than adding every ID to several lists. Keep immutable sources and small explicit patches separate; fail when an expected patch target changes. Normal builds remain offline.
3. Reuse four family adapters: QLOBE shared paths/input/audio/home controls; Sugarizer standalone environment and journal/server removal; H5P local player/dependencies/content; Blockly local compiled runtime. Preserve original interactions and art. Do not rewrite games into generic quizzes or impose four-round completion.
4. Deliver the nine remaining non-recording QLOBE games first, then one representative Sugarizer activity before batching the other nine, then the three H5P activities and Blockly. Puppet remains a separate microphone decision; a no-recording storytelling variant would have reduced scope and must be labeled accordingly. Original playable activities do not imply the handoff's proposed harder missions/content banks are finished.
5. All new imports default to Explore: no learning session start/finish, wallet writes, skill changes or analytics integration. Existing scored games retain their behavior. Promote selected games separately only when real result hooks are worthwhile.
6. Test shared lifecycle once thoroughly, then table-driven load/ready/exit/network checks plus a genuine interaction for every imported game on Chromium/WebKit at phone/iPad sizes. Test representative drag, canvas and audio modes; check that Explore leaves rewards unchanged. Do not repeat scored reward/replay scenarios for unscored games. Finish with one complete regression run.

Success means playable original controls, readable layouts, local assets and reliable exit. Loading 30 iframes is not evidence that all 30 activities work. This proposal reduces integration scope; it does not promise instant import or completion of new authored content.
