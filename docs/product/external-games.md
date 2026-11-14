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
