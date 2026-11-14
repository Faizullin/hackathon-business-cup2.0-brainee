# Secret Message Lab

QLOBE Kids by kaigani, MIT. See artifact/LICENSE.
Pinned repository: https://github.com/kaigani/qlobe-kids/tree/60967634e6cc313c41a5aa8067bed9f0f616176c/games/secret-message-copy

`artifact/` retains selected original files byte-for-byte, verified by Git blob SHA-1 and SHA-256 in `sources.lock.json`. The build applies `games/secret-message-copy/build.mjs` and the session bridge adapter. Original stamps, artwork, character art, sound assets, and core memory sequence copying are preserved.

Brainee changes:
- Integrated with protocol 2 Brainee game bridge (`secret-message-copy@1`).
- Deterministic round sequence using issued seed and level (3 difficulty levels: L1 length 5, reveal 6s; L2 length 6, reveal 5s; L3 length 7, 1 requested peek allowed).
- Structured three-phase cycle: preview -> recall -> Check.
- Explicit Check button: mistakes count only on full committed attempt (incomplete or incorrect sequence submitted via Check).
- Repeated Check when finished does not duplicate completion or result events.
- Touch targets >= 48px.
- Audio only on intentional user interaction, no autoplay.
- Reports exactly one `GameResult` with `{ gameId, level, rounds: 4, mistakes, corrections, durationMs }`.
- No stars or external API calls granted directly by the game.
