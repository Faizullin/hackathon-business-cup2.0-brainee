# External learning games (30-game handoff, condensed)

Source: [BRAINY_30_GAMES_HANDOFF_RU.md](../ideas/BRAINY_30_GAMES_HANDOFF_RU.md) and `docs/ideas/Brainy_30_Game_Handoff.zip` (catalog, pinned sources, `launch_games.py`, H5P starter content). Decision: [D-25](../dev/decisions.md); locale/age: D-22.

- **Audience in the handoff:** US English, Grade 1–3 (15 games for 6–7, 15 for ~8). We stay Russian for now (D-22); English-only games wait for `en.ts` or must be language-light.
- **Sources and licences (checked on GitHub):** QLOBE-kids 15 games (MIT), Sugarizer 11 (Apache-2.0), H5P Drag Text / Sort Paragraphs / Dictation 3 (MIT, player h5p-standalone MIT), Blockly Games maze 1 (Apache-2.0). Bundled media can carry its own terms: keep each game's LICENSE/CREDITS.
- **Integration = path C** ([games.md](../dev/games.md#scaling-three-paths-in-one-contract-d-16)): pinned, checksummed static builds served from our origin; T-29 bridge + `IframeGame`; one adapter per game that reports real attempts as our unchanged `GameResult`; the handoff's manifest is a draft for T-89; conformance (T-90) before listing.
- **Per-game work:** harder levels (QLOBE targets 4–6), content banks (3 levels × ≥4 sessions), Russian text/voice, removing Sugarizer journal/home and external fonts.
- **First wave (handoff):** Tangram Tales, Sentence Workshop, Secret Message Lab, Rhythm Copycat, Target Number Lab, Mirror Grid, Context Clues, Paragraph Detective, Code the Maze, Reading Detective. **Our first pick: Tangram Tales** (QLOBE, no build step, logic 0.7 + motor 0.3, little text), after Picture Puzzle (T-85).
- **`launch_games.py`:** developer-only, downloads from the internet; run once after review for chosen games, commit only the built output. Never fetch at runtime.

## Import status (2026-11-14)

| Game / group | Status | Scope or remaining work |
|---|---|---|
| Tangram Tales (T-105) | Imported, simplified | Pinned MIT QLOBE artifact; Russian guided mode; four silhouettes; three levels (4/5/6 movable pieces); logic .7 / motor .3, 6+. Orientation snaps; native select/place replaces drag/hold. No free mode, narration or local progress. [Contract and tests](../dev/games.md#pinned-path-c-tangram-tales-t-105). |
| Mirror Grid | Next, not listed | First Sugarizer adapter: remove journal/server/home/font dependencies; reflection missions and real attempts. logic .7 / attention .3, 7+. |
| Rhythm Copycat | Queued | Russian/muted-voice QLOBE adapter; memory .7 / attention .3, 5+. |
| Code the Maze | Queued | Pinned Blockly build, local Russian locale (`lang=ru`), four mission rounds. logic .7 / attention .3, 7+. |
| Last Token Challenge, Target Number Lab, Shape Detective | Queued in that order | Separate game-attempt adapters and four-round acceptance; logic .7 / attention .3; ages 7+, 8+, 6+. |
| Secret Message Lab, Sentence Workshop, Paragraph Detective, Meaning Match Memory, Clock Missions | Wave 2, not listed | Author short Russian missions/content; H5P player adapter where needed; 24-hour Russian clock. Final secondary skills follow the pinned catalog. |
| Magnet, sink-or-float, shadow, physics free labs | Skipped | Need authored missions before measurable rounds. |
| Puppet Retell | Skipped | Microphone/privacy scope. |
| Listen & Write; Word Maze / Reading Detective / Context Clues | Deferred to T-104 | English audio or reading content. |

This delivery completes the first priority import only. Queued games have not been copied into the runtime or advertised as playable; the handoff's launch/probe evidence is not acceptance evidence for our bridge/reward integration.
