# Tangram Tales

QLOBE Kids by kaigani, MIT. See artifact/LICENSE.
Pinned repository: https://github.com/kaigani/qlobe-kids/tree/60967634e6cc313c41a5aa8067bed9f0f616176c/games/tangram-tales

`artifact/` retains selected original files byte-for-byte, verified by Git blob SHA-1 and SHA-256 in `sources.lock.json`. The build applies `scripts/build-tangram.mjs` and the local session adapter. Original art, silhouettes, family matching, snapping are retained. Equal-size triangles remain interchangeable; guided pieces snap to target orientation, as upstream.

Brainee changes: Russian guided chrome, four distinct seeded silhouettes, 4/5/6 movable pieces at levels 1/2/3, explicit Check, native button input (select, then place; guided orientation snaps automatically), no free play/progress storage/debug interface, no narration or idle prompts. A failed Check on an incomplete silhouette counts as one mistake; a completed silhouette after any failed Checks counts as one correction. Failed drops, rotations and selections do not count. Completion requires all seven pieces and Check. No stars are granted by this game.
