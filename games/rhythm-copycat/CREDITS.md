# Rhythm Copycat

QLOBE Kids by kaigani, MIT. See artifact/LICENSE.
Pinned repository: https://github.com/kaigani/qlobe-kids/tree/60967634e6cc313c41a5aa8067bed9f0f616176c/games/rhythm-copycat

`artifact/` retains selected original files byte-for-byte, verified by Git blob SHA-1 and SHA-256 in `sources.lock.json`. The build applies `games/rhythm-copycat/build.mjs` and the session bridge adapter. Original character art, audio assets, percussion synthesis, pad visuals, and core copycat gameplay mechanics are preserved.

Brainee changes:
- Integrated with protocol 2 Brainee game bridge (`rhythm-copycat@1`).
- Deterministic round sequence using issued seed and level (3 difficulty levels: L1 length 5, L2 length 6-7, L3 length 8).
- Exactly 4 completed rhythm patterns per session.
- Visual mode without audio is supported: sequence is fully visible via chip highlights, pad flashes, and character poses even without audio.
- Audio plays only on intentional user interaction; no autoplay.
- No speed grading: children enter rhythms at their own pace.
- Touch targets >= 48px.
- Mistakes count only on full failed committed sequence; one correction recorded per completed task with prior errors.
- Reports exactly one `GameResult` with `{ gameId, level, rounds: 4, mistakes, corrections, durationMs }`.
- No stars or external API calls granted directly by the game.
